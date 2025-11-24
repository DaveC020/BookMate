import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BookMate.settings')
django.setup()

from django.conf import settings
from supabase import create_client

print("Testing Supabase Configuration...")
print(f"SUPABASE_URL: {settings.SUPABASE_URL}")
print(f"SUPABASE_KEY: {settings.SUPABASE_KEY[:20]}...")
print(f"SUPABASE_BUCKET: {settings.SUPABASE_BUCKET}")

try:
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    print("\n✅ Supabase client created successfully!")
    
    # Test bucket access
    print(f"\nTesting bucket '{settings.SUPABASE_BUCKET}' access...")
    buckets = supabase.storage.list_buckets()
    print(f"Available buckets: {[b.name for b in buckets]}")
    
    # Check if our bucket exists
    bucket_names = [b.name for b in buckets]
    if settings.SUPABASE_BUCKET in bucket_names:
        print(f"✅ Bucket '{settings.SUPABASE_BUCKET}' found!")
        
        # List files in bucket
        files = supabase.storage.from_(settings.SUPABASE_BUCKET).list()
        print(f"Files in bucket: {len(files)} files")
        for f in files:
            print(f"  - {f['name']}")
    else:
        print(f"❌ Bucket '{settings.SUPABASE_BUCKET}' not found!")
        print("Please create the bucket in Supabase dashboard.")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
