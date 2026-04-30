# Payments and Order Tracking Setup

This project now supports a no-backend checkout flow:

1. Customer fills checkout form.
2. App stores the order in browser local storage.
3. App optionally posts the order payload to your webhook (Google Apps Script).
4. Customer is redirected to your Stripe Payment Link.

## 1) Configure Stripe Payment Link

- In Stripe Dashboard, create a **Payment Link** for your base gift product.
- Copy the payment link URL.
- Create a `.env` file in the project root:

```bash
VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/your-real-link
VITE_ORDER_WEBHOOK_URL=
```

Restart the dev server after adding env values.

## 2) Optional: Save Orders to Google Sheets

You can log all incoming orders into a Google Sheet using an Apps Script Web App.

### Apps Script code

Use this script in a Google Sheet bound Apps Script project:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Orders");
    sheet.appendRow([
      "createdAt",
      "orderId",
      "status",
      "template",
      "total",
      "recipientName",
      "recipientEmail",
      "shippingSpeed",
      "giftMessage",
    ]);
  }

  var payload = JSON.parse(e.postData.contents || "{}");
  sheet.appendRow([
    payload.createdAt || "",
    payload.orderId || "",
    payload.status || "",
    payload.template || "",
    payload.total || "",
    payload.recipientName || "",
    payload.recipientEmail || "",
    payload.shippingSpeed || "",
    payload.giftMessage || "",
  ]);

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

Deploy as **Web App** (execute as you, access: anyone with link), then set:

```bash
VITE_ORDER_WEBHOOK_URL=https://script.google.com/macros/s/your-web-app-id/exec
```

## 3) Export Orders as CSV

The app includes an **Order tracking snapshot** section with a **Download Orders CSV** button.
This is compatible with Google Sheets import.
