#!/bin/bash

# =============================================================================
# Recuro Subscription Management System - End-to-End Test Script
# =============================================================================
# This script tests the complete invoice generation flow:
# 1. Login as admin
# 2. Create a product
# 3. Create a recurring plan
# 4. Link product to plan
# 5. Create a customer
# 6. Create a subscription
# 7. Add subscription lines
# 8. Update subscription status
# 9. Generate invoice
# 10. Download PDF invoice
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000/api"
COOKIE_JAR="cookies.txt"
OUTPUT_DIR="test_output"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    rm -f "$COOKIE_JAR"
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Print step header
print_step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📋 STEP $1: $2${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Print info
print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# =============================================================================
# STEP 1: Login as Admin
# =============================================================================
print_step 1 "Login as Admin"

# Login and save session cookie
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "aryan26zzz@gmail.com",
        "password": "admin123"
    }')

echo "Login Response: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    print_success "Login successful!"
    USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"user_id":[0-9]*' | head -1 | cut -d':' -f2)
    print_info "Logged in as user_id: $USER_ID"
else
    print_error "Login failed!"
    exit 1
fi

# =============================================================================
# STEP 2: Create a Tax
# =============================================================================
print_step 2 "Create a Tax"

TAX_RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X POST "$BASE_URL/taxes" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "GST 18%",
        "region": "India",
        "calculation_type": "PERCENTAGE",
        "value": 18
    }')

echo "Tax Response: $TAX_RESPONSE"

TAX_ID=$(echo "$TAX_RESPONSE" | grep -o '"tax_id":[0-9]*' | head -1 | cut -d':' -f2)
print_success "Tax created with ID: $TAX_ID"

# =============================================================================
# STEP 3: Create a Product
# =============================================================================
print_step 3 "Create a Product"

PRODUCT_RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X POST "$BASE_URL/product" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "SaaS Premium Plan",
        "type": "SERVICE",
        "sales_price": 99.99,
        "cost_price": 20.00,
        "is_recurring": true,
        "status": "ACTIVE"
    }')

echo "Product Response: $PRODUCT_RESPONSE"

PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | grep -o '"product_id":[0-9]*' | head -1 | cut -d':' -f2)
print_success "Product created with ID: $PRODUCT_ID"

# =============================================================================
# STEP 4: Create a Recurring Plan
# =============================================================================
print_step 4 "Create a Recurring Plan"

PLAN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X POST "$BASE_URL/recurringPlan" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Premium Monthly",
        "billing_period": "MONTHLY",
        "is_closable": true,
        "is_pausable": true,
        "is_renewable": true,
        "auto_close_after_days": null
    }')

echo "Plan Response: $PLAN_RESPONSE"

PLAN_ID=$(echo "$PLAN_RESPONSE" | grep -o '"plan_id":[0-9]*' | head -1 | cut -d':' -f2)
print_success "Recurring plan created with ID: $PLAN_ID"

# =============================================================================
# STEP 5: Link Product to Plan (Product Plan Price)
# =============================================================================
print_step 5 "Link Product to Plan"

PPP_RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X POST "$BASE_URL/productPlanPrices" \
    -H "Content-Type: application/json" \
    -d "{
        \"product_id\": $PRODUCT_ID,
        \"plan_id\": $PLAN_ID,
        \"price\": 99.99,
        \"min_quantity\": 1
    }")

echo "Product-Plan-Price Response: $PPP_RESPONSE"

PPP_ID=$(echo "$PPP_RESPONSE" | grep -o '"product_plan_price_id":[0-9]*' | head -1 | cut -d':' -f2)
print_success "Product linked to plan with ID: $PPP_ID"

# =============================================================================
# STEP 6: Create a Customer (Contact)
# =============================================================================
print_step 6 "Create a Customer"

# Generate unique email
TIMESTAMP=$(date +%s)
CUSTOMER_EMAIL="customer_${TIMESTAMP}@example.com"

CONTACT_RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X POST "$BASE_URL/contacts" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$CUSTOMER_EMAIL\",
        \"fname\": \"John\",
        \"lname\": \"Doe\",
        \"phone\": \"+91999999999\",
        \"role\": \"user\",
        \"company_name\": \"Acme Corporation\",
        \"billing_address\": {
            \"street\": \"123 Main St\",
            \"city\": \"Mumbai\",
            \"zip\": \"400001\"
        },
        \"shipping_address\": {
            \"street\": \"456 Shipping Rd\",
            \"city\": \"Mumbai\",
            \"zip\": \"400002\"
        },
        \"tax_id\": \"GST123456\",
        \"is_customer\": true
    }")

echo "Contact Response: $CONTACT_RESPONSE"

CONTACT_ID=$(echo "$CONTACT_RESPONSE" | grep -o '"contact_id":[0-9]*' | head -1 | cut -d':' -f2)
print_success "Customer created with ID: $CONTACT_ID"

# =============================================================================
# STEP 7: Create a Subscription
# =============================================================================
print_step 7 "Create a Subscription"

SUBSCRIPTION_NUMBER="SUB-TEST-$(date +%s)"

SUBSCRIPTION_RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X POST "$BASE_URL/subscriptions" \
    -H "Content-Type: application/json" \
    -d "{
        \"subscription_number\": \"$SUBSCRIPTION_NUMBER\",
        \"customer_id\": $CONTACT_ID,
        \"plan_id\": $PLAN_ID,
        \"start_date\": \"$(date +%Y-%m-%d)\",
        \"payment_terms\": 30
    }")

echo "Subscription Response: $SUBSCRIPTION_RESPONSE"

SUBSCRIPTION_ID=$(echo "$SUBSCRIPTION_RESPONSE" | grep -o '"subscription_id":[0-9]*' | head -1 | cut -d':' -f2)
print_success "Subscription created with ID: $SUBSCRIPTION_ID"

# =============================================================================
# STEP 8: Add Subscription Line (Product)
# =============================================================================
print_step 8 "Add Subscription Line"

LINE_RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X POST "$BASE_URL/subscriptions/$SUBSCRIPTION_ID/lines" \
    -H "Content-Type: application/json" \
    -d "{
        \"product_id\": $PRODUCT_ID,
        \"quantity\": 1,
        \"unit_price\": 99.99,
        \"tax_id\": $TAX_ID
    }")

echo "Subscription Line Response: $LINE_RESPONSE"

LINE_ID=$(echo "$LINE_RESPONSE" | grep -o '"line_id":[0-9]*' | head -1 | cut -d':' -f2)
print_success "Subscription line added with ID: $LINE_ID"

# =============================================================================
# STEP 9: Update Subscription Status (QUOTATION -> CONFIRMED -> ACTIVE)
# =============================================================================
print_step 9 "Update Subscription Status"

# First, update to CONFIRMED
echo "→ Updating status to CONFIRMED..."
STATUS_RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X PUT "$BASE_URL/subscriptions/$SUBSCRIPTION_ID/status" \
    -H "Content-Type: application/json" \
    -d '{"status": "CONFIRMED"}')

echo "Status Update Response: $STATUS_RESPONSE"
print_success "Status updated to CONFIRMED"

# Then, update to ACTIVE
echo "→ Updating status to ACTIVE..."
STATUS_RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X PUT "$BASE_URL/subscriptions/$SUBSCRIPTION_ID/status" \
    -H "Content-Type: application/json" \
    -d '{"status": "ACTIVE"}')

echo "Status Update Response: $STATUS_RESPONSE"
print_success "Status updated to ACTIVE"

# =============================================================================
# STEP 10: Generate Invoice from Subscription
# =============================================================================
print_step 10 "Generate Invoice from Subscription"

TODAY=$(date +%Y-%m-%d)
DUE_DATE=$(date -d "+30 days" +%Y-%m-%d)
PERIOD_START=$(date -d "+1 day" +%Y-%m-%d)
PERIOD_END=$(date -d "+31 days" +%Y-%m-%d)

INVOICE_RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X POST "$BASE_URL/invoices/generate/$SUBSCRIPTION_ID" \
    -H "Content-Type: application/json" \
    -d "{
        \"issue_date\": \"$TODAY\",
        \"due_date\": \"$DUE_DATE\",
        \"period_start\": \"$PERIOD_START\",
        \"period_end\": \"$PERIOD_END\"
    }")

echo "Invoice Response: $INVOICE_RESPONSE"

INVOICE_ID=$(echo "$INVOICE_RESPONSE" | grep -o '"invoice_id":[0-9]*' | head -1 | cut -d':' -f2)
INVOICE_NUMBER=$(echo "$INVOICE_RESPONSE" | grep -o '"invoice_number":"[^"]*"' | head -1 | cut -d'"' -f4)
print_success "Invoice generated with ID: $INVOICE_ID, Number: $INVOICE_NUMBER"

# =============================================================================
# STEP 11: Get Invoice Details (JSON)
# =============================================================================
print_step 11 "Get Invoice Details (JSON)"

INVOICE_DETAILS=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X GET "$BASE_URL/invoices/$INVOICE_ID")

echo "Invoice Details: $INVOICE_DETAILS"
print_success "Invoice details retrieved"

# =============================================================================
# STEP 12: Download Invoice PDF
# =============================================================================
print_step 12 "Download Invoice PDF"

PDF_OUTPUT="$OUTPUT_DIR/invoice_${INVOICE_NUMBER}.pdf"

curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X GET "$BASE_URL/invoices/$INVOICE_ID/download" \
    -o "$PDF_OUTPUT"

if [ -f "$PDF_OUTPUT" ]; then
    FILE_SIZE=$(stat -f%z "$PDF_OUTPUT" 2>/dev/null || stat -c%s "$PDF_OUTPUT" 2>/dev/null)
    print_success "PDF downloaded successfully!"
    print_info "File: $PDF_OUTPUT"
    print_info "Size: $FILE_SIZE bytes"
else
    print_error "PDF download failed!"
    exit 1
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 END-TO-END FLOW COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo "   • Product ID:       $PRODUCT_ID"
echo "   • Plan ID:          $PLAN_ID"
echo "   • Tax ID:           $TAX_ID"
echo "   • Customer ID:      $CONTACT_ID"
echo "   • Subscription ID: $SUBSCRIPTION_ID"
echo "   • Invoice ID:       $INVOICE_ID"
echo "   • Invoice Number:   $INVOICE_NUMBER"
echo ""
echo -e "${BLUE}📄 Output:${NC}"
echo "   • PDF Invoice:      $PDF_OUTPUT"
echo ""
echo -e "${YELLOW}💡 To view the PDF, open: $PDF_OUTPUT${NC}"
echo ""

