/**
 * Quick test to verify email rendering works without React hooks error
 */

// This would normally be run in the app context, but here's the concept:
async function testEmailRendering() {
  try {
    console.log("Testing email rendering with new SSR-safe i18n...");

    // Import the render function
    const {
      renderEmailWithI18N,
    } = require("./packages/lib/utils/render-email-with-i18n.tsx");
    const {
      DocumentInviteEmailTemplate,
    } = require("./packages/email/templates/document-invite.tsx");
    const React = require("react");

    // Test rendering an email
    const html = await renderEmailWithI18N(
      React.createElement(DocumentInviteEmailTemplate, {
        documentName: "Test Document.pdf",
        inviterName: "Test User",
        inviterEmail: "test@example.com",
        recipientName: "Recipient",
        recipientEmail: "recipient@example.com",
        signDocumentActionUrl: "https://example.com/sign",
        role: "SIGNER",
        assetBaseUrl: "http://localhost:3000",
      }),
      { lang: "en" }
    );

    console.log("✅ Email rendered successfully!");
    console.log("HTML length:", html.length);
    console.log(
      "Contains expected content:",
      html.includes("Test Document.pdf")
    );

    return true;
  } catch (error) {
    console.error("❌ Email rendering failed:", error.message);
    console.error(error.stack);
    return false;
  }
}

// Run test
if (require.main === module) {
  testEmailRendering()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { testEmailRendering };
