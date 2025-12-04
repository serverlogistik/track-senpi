#!/bin/bash
# test-backend.sh
# Quick test script untuk backend API

echo "===================================="
echo "  Track Senpi - Backend API Test"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if server is running
echo "[1/5] Testing server health..."
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}[OK] Server is running${NC}"
    curl -s http://localhost:3000/api/health | jq .
else
    echo -e "${RED}[FAIL] Server tidak running. Jalankan: cd backend && npm run dev${NC}"
    exit 1
fi
echo ""

# Test admin login
echo "[2/5] Testing admin login..."
response=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"nrp":"00000001","password":"admin123"}')

if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    echo -e "${GREEN}[OK] Admin login berhasil${NC}"
    echo "$response" | jq .
else
    echo -e "${RED}[FAIL] Admin login gagal${NC}"
    echo "$response"
fi
echo ""

# Test get users
echo "[3/5] Testing get users..."
if curl -s http://localhost:3000/api/users > /dev/null; then
    echo -e "${GREEN}[OK] Get users berhasil${NC}"
else
    echo -e "${RED}[FAIL] Get users gagal${NC}"
fi
echo ""

# Test get senpi
echo "[4/5] Testing get senpi..."
if curl -s http://localhost:3000/api/senpi > /dev/null; then
    echo -e "${GREEN}[OK] Get senpi berhasil${NC}"
else
    echo -e "${RED}[FAIL] Get senpi gagal${NC}"
fi
echo ""

# Test get locations
echo "[5/5] Testing get locations..."
if curl -s http://localhost:3000/api/location/latest > /dev/null; then
    echo -e "${GREEN}[OK] Get locations berhasil${NC}"
else
    echo -e "${RED}[FAIL] Get locations gagal${NC}"
fi
echo ""

echo "===================================="
echo "  Test Selesai!"
echo "===================================="
echo ""
echo "Next: Buka index.html di browser dan test login"
echo ""
