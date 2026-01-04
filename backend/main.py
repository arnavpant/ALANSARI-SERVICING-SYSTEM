import os
import asyncio
from fastapi import FastAPI
from imap_tools import MailBox, AND
from supabase import create_client, Client
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta
from dotenv import load_dotenv  

load_dotenv()

# --- CONFIGURATION ---
# We load these from "Environment Variables" so your passwords aren't in the code
IMAP_SERVER = os.getenv("IMAP_SERVER")
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# --- DATABASE CONNECTION ---
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- THE EMAIL LOGIC ---
def process_emails():
    """
    Processes unread emails from the last 7 days.
    
    Why 7 days?
    - Handles overnight emails (server off 6 PM - 7 AM)
    - Handles weekend emails (Friday 6 PM - Monday 7 AM)
    - Handles missed emails during crashes/restarts
    - Prevents processing ancient unread emails
    
    Deduplication ensures emails are never processed twice.
    """
    print("🔍 Checking for new emails...")
    try:
        with MailBox(IMAP_SERVER).login(EMAIL_USER, EMAIL_PASS) as mailbox:
            
            # --- BUSINESS HOURS EMAIL CHECKING ---
            # Check last 7 days to catch overnight/weekend emails
            seven_days_ago = (datetime.now() - timedelta(days=7)).strftime("%Y/%m/%d")
            
            # Gmail filter: Primary inbox + Unread + Last 7 days
            criteria = f'X-GM-RAW "category:primary is:unread after:{seven_days_ago}"'
            
            # For production Outlook (future):
            # criteria = AND(seen=False, date_gte=(date.today() - timedelta(days=7)))

            # ---------------------------
            
            emails_found = 0
            emails_processed = 0
            emails_skipped = 0

            for msg in mailbox.fetch(criteria):
                emails_found += 1
                print(f"\n📧 Found email #{emails_found}:")
                print(f"   From: {msg.from_}")
                print(f"   Subject: {msg.subject}")
                print(f"   Date: {msg.date}")
                
                # Get Message-ID safely (unique identifier for deduplication)
                msg_id_list = msg.headers.get('message-id')
                if isinstance(msg_id_list, list) and msg_id_list:
                    unique_id = msg_id_list[0]
                elif isinstance(msg_id_list, str):
                    unique_id = msg_id_list
                else:
                    unique_id = str(msg.uid)

                # 1. Deduplication Check (prevents duplicate jobs)
                response = supabase.table('jobs').select('id').match({
                    'email_source_id': unique_id
                }).execute()

                if response.data:
                    print(f"   ⚠️  Already processed (Job ID: {response.data[0]['id']}) - Skipping")
                    emails_skipped += 1
                    continue

                # 2. Prepare Data
                new_job = {
                    "email_source_id": unique_id,
                    "date_received": msg.date.isoformat(),
                    "sender_email": msg.from_,
                    "email_subject": msg.subject,
                    "status": "DRAFT_FROM_EMAIL",
                    "retailer_name": msg.from_.split('@')[1] if '@' in msg.from_ else "Unknown"
                }

                # 3. Insert into Supabase
                result = supabase.table('jobs').insert(new_job).execute()
                if result.data:
                    print(f"   ✅ Created Draft Job (ID: {result.data[0]['id']})")
                    emails_processed += 1
                else:
                    print(f"   ❌ Failed to save")
            
            # Summary
            print(f"\n📊 Email Check Summary:")
            print(f"   Found: {emails_found} | Processed: {emails_processed} | Skipped: {emails_skipped}")
                
    except Exception as e:
        print(f"\n❌ ERROR checking emails: {e}")
        # Future: Send alert to admin (email/SMS/Slack)

# --- BACKGROUND TASK ---
async def email_loop():
    """Runs the email checker every 60 seconds forever"""
    while True:
        process_emails()
        await asyncio.sleep(60) # Wait 60 seconds

# --- WEB SERVER LIFECYCLE ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Process any emails that arrived while server was off
    print("\n" + "="*60)
    print("🚀 SERVER STARTING - BUSINESS HOURS MODE")
    print("="*60)
    print("📧 Checking for overnight/weekend emails...")
    process_emails()  # Immediate check on startup
    print("\n✅ Startup email check complete. Starting regular loop...")
    print("="*60 + "\n")
    
    # Start the background loop
    asyncio.create_task(email_loop())
    yield
    # Shutdown: (Cleanup if needed)
    print("\n🛑 Server shutting down. See you tomorrow at 7 AM!")

app = FastAPI(lifespan=lifespan)

# --- THE HEALTH ENDPOINT (Crucial for UptimeRobot) ---
@app.get("/")
def health_check():
    return {"status": "running", "message": "I am awake!"}