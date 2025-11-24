import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BookMate.settings')
django.setup()

from django.conf import settings
from supabase import create_client

print("Testing Supabase Upload...")
print(f"URL: {settings.SUPABASE_URL}")
print(f"Bucket: {settings.SUPABASE_BUCKET}")

try:
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    print("✅ Client created")
    
    # Try to upload a test file
    test_content = b"Test file content"
    test_filename = "test_upload.txt"
    
    print(f"\nAttempting to upload '{test_filename}'...")
    response = supabase.storage.from_(settings.SUPABASE_BUCKET).upload(
        path=test_filename,
        file=test_content,
        file_options={"content-type": "text/plain", "upsert": "true"}
    )
    
    print(f"✅ Upload successful!")
    print(f"Response: {response}")
    
    # Get public URL
    public_url = supabase.storage.from_(settings.SUPABASE_BUCKET).get_public_url(test_filename)
    print(f"Public URL: {public_url}")
    
    # List files
    print("\nListing files...")
    files = supabase.storage.from_(settings.SUPABASE_BUCKET).list()
    print(f"Files: {files}")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print(f"Error type: {type(e)}")
    import traceback
    traceback.print_exc()
