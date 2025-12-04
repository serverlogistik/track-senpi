#!/bin/bash
# update-api-url.sh
# Script untuk update API URL di frontend setelah deploy Railway

echo "🔧 Update API URL Script"
echo "========================"
echo ""

# Prompt untuk Railway URL
read -p "Masukkan Railway URL kamu (contoh: https://track-senpi-production.up.railway.app): " RAILWAY_URL

# Remove trailing slash if any
RAILWAY_URL=${RAILWAY_URL%/}

echo ""
echo "Railway URL: $RAILWAY_URL"
echo "API URL: $RAILWAY_URL/api"
echo ""

# Backup original file
cp js/api-client.js js/api-client.js.backup
echo "✅ Backup created: js/api-client.js.backup"

# Update API URL di api-client.js
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|: 'https://your-railway-app.up.railway.app/api'|: '$RAILWAY_URL/api'|g" js/api-client.js
else
    # Linux/WSL
    sed -i "s|: 'https://your-railway-app.up.railway.app/api'|: '$RAILWAY_URL/api'|g" js/api-client.js
fi

echo "✅ Updated js/api-client.js"
echo ""
echo "🎉 Done! API URL berhasil di-update."
echo ""
echo "Next steps:"
echo "1. Commit changes: git add js/api-client.js"
echo "2. Push to repository: git commit -m 'Update API URL' && git push"
echo "3. Test login di browser"
echo ""
