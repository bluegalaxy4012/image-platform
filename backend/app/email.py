import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
from dotenv import load_dotenv
import os

from app.auth import create_verification_token

load_dotenv()
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL")

def send_email(to_email: str, subject: str, body: str):
    print(GMAIL_USER)
    msg = MIMEMultipart()
    msg['From'] = GMAIL_USER
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(GMAIL_USER, GMAIL_PASSWORD)

            server.sendmail(GMAIL_USER, to_email, msg.as_string())
            server.close()

        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
    
def send_register_email(email: str, username: str):
    code = secrets.token_urlsafe(6)

    verification_token = create_verification_token(email, code)

    subject = "Welcome to RapidPic"
    body = f"Hello {username},\n\nThank you for registering on RapidPic Image Platform. Your verification link is: {FRONTEND_URL}/verify?token={verification_token}\n\nPlease verify your account within 15 minutes."
    
    return send_email(email, subject, body), code

def send_password_reset_email(email: str, username: str):
    code = secrets.token_urlsafe(6)

    verification_token = create_verification_token(email, code) 

    subject = "RapidPic Password Reset Request"
    body = f"Hello {username},\n\nYou requested a password reset. Continue at the following link: {FRONTEND_URL}/reset-password?token={verification_token}\n\nThis link is valid for 15 minutes."
    
    return send_email(email, subject, body), code

# def test_email():
#     if send_register_email("blueblueblue@yahoo.com", "Blue"):
#         print("Registration email sent successfully")
#     else:
#         print("Failed to send registration email")
