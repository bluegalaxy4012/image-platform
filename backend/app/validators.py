import re
from fastapi import HTTPException



def validate_email(email: str):
    regex = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

    if not regex.match(email):
        raise HTTPException(status_code=400, detail="Invalid email format")

def validate_username(username: str):
    regex = re.compile(r'^[0-9A-Za-z]{6,16}$')

    if not regex.match(username):
        raise HTTPException(
            status_code=400, 
            detail="Username must be 6-16 characters long, letters and digits only"
        )


def validate_password(password: str):
    pattern = re.compile(r'^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$')
    if not pattern.match(password):
        raise HTTPException(
            status_code=400,
            detail=(
                "Password must have at least 8 characters and include:\n"
                "- At least 1 uppercase letter\n"
                "- At least 1 lowercase letter\n"
                "- At least 1 digit\n"
                "- At least 1 special character (#?!@$%^&*-)"
            )
        )

