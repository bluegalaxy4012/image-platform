import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
from dotenv import load_dotenv
import os

load_dotenv()
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD")

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

    subject = "Welcome to RapidPic Image Platform"
    body = f"Hello {username},\n\nThank you for registering on RapidPic Image Platform. Your verification link is: https://rapidpic.marian.homes/verify?email={email}&code={code}\n\nPlease verify your account within 15 minutes."
    
    return send_email(email, subject, body), code

def send_password_reset_email(email: str, username: str):
    code = secrets.token_urlsafe(6)

    subject = "Password Reset Request"
    body = f"Hello {username},\n\nYou requested a password reset. Your verification code is {code}."
    
    return send_email(email, subject, body), code

# def test_email():
#     if send_register_email("blueblueblue40@yahoo.com", "Blue"):
#         print("Registration email sent successfully")
#     else:
#         print("Failed to send registration email")
