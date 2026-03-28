import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("OPENAI_API_KEY")

if not api_key:
    api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("КРИТИЧЕСКАЯ ОШИБКА: Ключ API не найден в переменных окружения!")

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=api_key
)


def generate_job_description(position: str, company: str = None) -> str:
    if not position:
        return ""

    context = f"для должности '{position}'"
    if company:
        context += f" в компании '{company}'"

    prompt = f"""
    ТЫ ДОЛЖЕН написать обязанности ТОЛЬКО для должности: {position}.
    Если указана компания {company}, учти её специфику.
    ЗАПРЕЩЕНО писать про программирование, если должность с этим не связана.
    Напиши 4-5 пунктов через символ '•'.
    """

    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "Ты - эксперт по написанию резюме и карьерный консультант."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"!!! ОШИБКА ГРОКА: {str(e)}")
        return "• Ошибка генерации. Проверь логи бэкенда."
