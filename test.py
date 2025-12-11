from serpapi import GoogleSearch
import json
import re
import requests  # Нужно установить: pip install requests

# Твой API ключ (ОБЯЗАТЕЛЬНО СГЕНЕРИРУЙ НОВЫЙ И ВСТАВЬ СЮДА)
API_KEY = "d32f8e0e31ff1ff1e3fefd37ba66efc18d03a97aa84aba5724fa7f55fce552f2"


def extract_data_id_from_url(url):
    """
    Функция принимает ссылку (короткую или длинную) и пытается достать data_id.
    """
    print(f"Обрабатываем ссылку: {url}")

    # 1. Если ссылка короткая (например, maps.app.goo.gl), раскрываем её
    try:
        if "goo.gl" in url or "maps.app" in url or "bit.ly" in url:
            response = requests.get(url, allow_redirects=True)
            url = response.url  # Получаем финальный длинный URL
            print("Ссылка была короткой, раскрыли в:", url[:60] + "...")
    except Exception as e:
        print(f"Ошибка при обработке ссылки: {e}")
        return None

    # 2. Ищем паттерн data_id (начинается с 0x, потом двоеточие, потом снова 0x)
    # Пример: 0x47e66e2964e34e2d:0x8ddca9ee380ef7e0
    match = re.search(r"(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)", url)

    if match:
        found_id = match.group(1)
        print(f"Нашли ID места: {found_id}")
        return found_id
    else:
        print("Не удалось найти data_id (CID) в этой ссылке.")
        return None


def get_google_maps_reviews(target_url):
    # Получаем ID из ссылки
    data_id = extract_data_id_from_url(target_url)

    if not data_id:
        print("Остановка: некорректная ссылка или не найден ID места.")
        return

    # Параметры запроса
    params = {
        "api_key": API_KEY,
        "engine": "google_maps_reviews",
        "data_id": data_id,  # Вставляем полученный ID
        "hl": "ru",
        "sort_by": "newestFirst",
    }

    try:
        print(f"--- Отправка запроса к SerpApi... ---")
        search = GoogleSearch(params)
        results = search.get_dict()

        # Проверка на ошибку в ответе API
        if "error" in results:
            print(f"Ошибка API: {results['error']}")
            return

        # 1. Вытаскиваем общую информацию о месте
        place_info = results.get("place_info", {})

        print("\n=== ИНФОРМАЦИЯ О МЕСТЕ ===")
        print(f"Название: {place_info.get('title', 'Неизвестно')}")
        print(f"Адрес: {place_info.get('address', 'Неизвестно')}")
        print(f"Средний рейтинг: {place_info.get('rating')}")
        print(f"Количество отзывов: {place_info.get('reviews')}")

        if "gps_coordinates" in place_info:
            print(f"Координаты: {place_info['gps_coordinates']}")

        # 2. Вытаскиваем отзывы
        reviews = results.get("reviews", [])

        print(f"\n=== ПОСЛЕДНИЕ ОТЗЫВЫ (Найдено на странице: {len(reviews)}) ===")

        if not reviews:
            print("Отзывов не найдено или доступ закрыт.")

        for index, review in enumerate(reviews, 1):
            user = review.get("user", {}).get("name", "Аноним")
            rating = review.get("rating")
            snippet = review.get("snippet", "Нет текста")
            date = review.get("date")
            likes = review.get("likes", 0)

            print(f"\n--- Отзыв #{index} ---")
            print(f"Пользователь: {user}")
            print(f"Оценка: {rating} / 5")
            print(f"Дата: {date}")
            print(f"Лайков: {likes}")
            print(f"Текст: {snippet}")

            if "images" in review:
                print(f"Прикреплено фото: {len(review['images'])} шт.")

        # 3. Пагинация
        if "serpapi_pagination" in results:
            next_page_token = results["serpapi_pagination"].get("next_page_token")
            print(f"\nЕсть следующая страница отзывов. Токен: {next_page_token}")
        else:
            print("\nЭто последняя страница отзывов.")

    except Exception as e:
        print(f"Произошла критическая ошибка: {e}")


if __name__ == "__main__":
    # Теперь скрипт просит ссылку при запуске
    user_link = input("Вставь ссылку на место из Google Maps: ").strip()
    if user_link:
        get_google_maps_reviews(user_link)
    else:
        print("Ссылка не была введена.")
