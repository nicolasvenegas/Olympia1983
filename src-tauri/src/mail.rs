use base64::Engine;
use lettre::{
    message::{header::ContentType, Attachment, Mailbox, MultiPart, SinglePart},
    transport::smtp::authentication::Credentials,
    Message, SmtpTransport, Transport,
};
use serde::Deserialize;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SmtpConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub from: String,
    /// "starttls" (587) | "implicit" (465) | "none"
    pub tls: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MailDraft {
    pub to: String,
    pub subject: String,
    pub body: String,
    pub attachment_name: String,
    pub attachment_base64: String,
}

/// Renderiza el multipart: cuerpo de texto plano + PNG adjunto.
fn build_message(config: &SmtpConfig, draft: &MailDraft) -> Result<Message, String> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(&draft.attachment_base64)
        .map_err(|e| format!("Adjunto PNG inválido: {e}"))?;

    let from: Mailbox = config.from.parse().map_err(|e| format!("Remitente inválido: {e}"))?;
    let to: Mailbox = draft.to.parse().map_err(|e| format!("Destinatario inválido: {e}"))?;

    let body = SinglePart::builder()
        .header(ContentType::TEXT_PLAIN)
        .body(draft.body.clone());

    let attachment = Attachment::new(draft.attachment_name.clone()).body(
        bytes,
        ContentType::parse("image/png").map_err(|e| format!("Tipo de adjunto inválido: {e}"))?,
    );

    Message::builder()
        .from(from)
        .to(to)
        .subject(draft.subject.clone())
        .multipart(MultiPart::mixed().singlepart(body).singlepart(attachment))
        .map_err(|e| e.to_string())
}

fn build_mailer(config: &SmtpConfig) -> Result<SmtpTransport, String> {
    let creds = Credentials::new(config.username.clone(), config.password.clone());
    let builder = match config.tls.as_str() {
        "starttls" => SmtpTransport::starttls_relay(&config.host).map_err(|e| e.to_string())?,
        "implicit" => SmtpTransport::relay(&config.host).map_err(|e| e.to_string())?,
        _ => SmtpTransport::builder_dangerous(&config.host),
    };
    Ok(builder.port(config.port).credentials(creds).build())
}

fn send_blocking(config: SmtpConfig, draft: MailDraft) -> Result<(), String> {
    let mailer = build_mailer(&config)?;
    let email = build_message(&config, &draft)?;
    mailer.send(&email).map_err(|e| format!("Error SMTP: {e}"))?;
    Ok(())
}

#[tauri::command]
pub async fn send_email(config: SmtpConfig, draft: MailDraft) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || send_blocking(config, draft))
        .await
        .map_err(|e| e.to_string())?
}
