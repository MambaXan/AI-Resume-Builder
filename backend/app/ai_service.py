import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("OPENAI_API_KEY")

if not api_key:
    api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("CRITICAL ERROR: API key not found in environment variables!")

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=api_key
)


def generate_job_description(position: str, company: str = None) -> str:
    if not position:
        return ""

    context = f"for the position '{position}'"
    if company:
        context += f" in the company '{company}'"

    prompt = f"""
    YOU MUST list responsibilities ONLY for the job title: {position}.
    If {company} is specified, consider its specifics.
    DO NOT write about programming unless the job title is related to it.
    Write 4-5 bullet points separated by '•'.
    """

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a resume writing expert and career consultant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )

        if response and response.choices:
            return response.choices[0].message.content.strip()
        return "• Error: empty response from AI."

    except Exception as e:
        print(f"!!! GROQ ERROR: {str(e)}")
        return f"• GENERATING ERROR: {str(e)}"
