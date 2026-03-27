# backend/app/ai_service.py
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Убедись, что OPENAI_API_KEY есть в твоем .env файле
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_job_description(position: str, company: str = None) -> str:
    """
    Генерирует профессиональные буллиты для опыта работы на основе должности.
    """
    if not position:
        return ""

    context = f"для должности '{position}'"
    if company:
        context += f" в компании '{company}'"

    prompt = f"""
    Напиши 4-5 сильных, профессиональных пунктов (bullet points) для раздела 'Опыт работы' в резюме {context}.
    Используй активные глаголы (например: Разработал, Увеличил, Внедрил).
    Сфокусируйся на достижениях и измеримых результатах, где это возможно.
    Напиши ответ на русском языке, каждый пункт с новой строки, без номеров и лишних символов.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo", # Или gpt-4, если есть доступ и бюджет
            messages=[
                {"role": "system", "content": "Ты - эксперт по написанию резюме и карьерный консультант."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )

        # Берем текст ответа и чистим его
        result = response.choices[0].message.content.strip()
        return result

    except Exception as e:
        print(f"Ошибка ИИ генерации: {e}")
        # Возвращаем заглушку, чтобы бэкенд не упал
        return "• Разработал и внедрил ключевые фичи.\n• Увеличил эффективность команды на 15%.\n• Оптимизировал процессы разработки.\n• Участвовал в проектировании архитектуры."