import asyncio
import re
from playwright.async_api import async_playwright


def extract_coords_from_url(url: str):
    # Ищем паттерн @51.1734259,71.4045855
    match = re.search(r"@([-.\d]+),([-.\d]+)", url)
    if match:
        return {"lat": float(match.group(1)), "lon": float(match.group(2))}
    return {"lat": None, "lon": None}


async def parse_google_reviews(url: str, max_reviews: int = 50):
    print(f"🚀 [FAST PARSER] Запуск: {url}")

    # Сразу пытаемся добавить язык в URL, если это не короткая ссылка
    target_url = url
    if "google.com/maps" in url and "hl=en" not in url:
        separator = "&" if "?" in url else "?"
        target_url = f"{url}{separator}hl=en"

    result = {
        "place_name": None,
        "rating": None,
        "reviews_count": 0,
        "reviews": [],
        "location": {},
    }

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",  # Скрываем автоматизацию
                "--no-sandbox",
                "--disable-gpu",  # Отключаем GPU для скорости на серверах
            ],
        )

        # 1. Форсируем локаль в контексте (чтобы Google сразу отдал EN версию)
        context = await browser.new_context(
            locale="en-US",
            timezone_id="America/New_York",  # Иногда помогает от редиректов на русскую версию
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )

        page = await context.new_page()

        # 2. БЛОКИРОВКА МУСОРА (Картинки, шрифты, CSS) - ГЛАВНОЕ УСКОРЕНИЕ
        await page.route(
            "**/*",
            lambda route: (
                route.abort()
                if route.request.resource_type
                in ["image", "media", "font", "stylesheet"]
                else route.continue_()
            ),
        )

        try:
            # Переход
            await page.goto(target_url, timeout=30000, wait_until="domcontentloaded")

            # Быстрая проверка на Cookie баннер (через JS быстрее)
            try:
                await page.get_by_text("Accept all").first.click(timeout=2000)
            except:
                pass

            # 3. СБОР ИНФО О МЕСТЕ (За один проход)
            try:
                # Ждем появления заголовка (значит контент загрузился)
                await page.wait_for_selector("h1", timeout=5000)

                # Забираем данные через JS (быстрее, чем локаторы Python)
                meta_data = await page.evaluate(
                    """() => {
                    const h1 = document.querySelector('h1');
                    const ratingEl = document.querySelector('div[role="img"][aria-label*="stars"]');
                    let rating = null;
                    if (ratingEl) {
                        const aria = ratingEl.getAttribute('aria-label');
                        const match = aria.match(/(\\d+[.,]\\d+)/);
                        if (match) rating = match[1];
                    }
                    return {
                        title: h1 ? h1.innerText : null,
                        rating: rating
                    }
                }"""
                )
                result["place_name"] = meta_data["title"]
                result["rating"] = meta_data["rating"]
            except Exception as e:
                print(f"⚠️ Warning info: {e}")

            # 4. ОТКРЫТИЕ ОТЗЫВОВ
            # Ищем кнопку Reviews. Если мы уже внутри (по ссылке), пропускаем
            if "Reviews" not in await page.title():
                try:
                    reviews_tab = page.locator(
                        'button[role="tab"][aria-label*="Reviews"], button:has-text("Reviews")'
                    ).first
                    if await reviews_tab.is_visible(timeout=3000):
                        await reviews_tab.click()
                        await page.wait_for_selector(
                            'div[role="feed"], .m6QErb', timeout=5000
                        )
                except:
                    pass  # Возможно уже открыто

            # 5. СКОРОСТНОЙ СКРОЛЛИНГ
            # Находим контейнер. Обычно это div с role="feed"
            scrollable_selector = 'div[role="feed"]'

            # Если feed не найден сразу, пробуем найти родителя первого отзыва
            if not await page.locator(scrollable_selector).count():
                print("⚠️ Ищем контейнер скролла альтернативным методом...")
                scrollable_selector = "div.m6QErb:has(div[data-review-id])"

            reviews_set = set()
            no_new_reviews_count = 0

            print("📜 [FAST PARSER] Скроллим...")

            while len(reviews_set) < max_reviews:
                # А. СКРОЛЛ ЧЕРЕЗ JS (Мгновенно)
                # Мы не крутим колесико попиксельно, мы шлем событие прокрутки
                reviews_count_in_dom = await page.evaluate(
                    """(selector) => {{
                    const el = document.querySelector(selector);
                    if (!el) return 0;
                    // Раскрываем кнопки "More" сразу JS-ом
                    document.querySelectorAll('button[aria-label^="See more"], button[aria-label^="More"]').forEach(b => b.click());
                    // Скроллим в самый низ
                    el.scrollTop = el.scrollHeight;
                    return document.querySelectorAll('div[data-review-id]').length;
                }}""",
                    scrollable_selector,
                )

                # Б. ЖДЕМ ПОДГРУЗКИ (но не тупо sleep, а checking)
                # Если элементов в DOM меньше чем нам надо, даем время прогрузиться
                if reviews_count_in_dom < max_reviews:
                    try:
                        # Ждем пока количество элементов увеличится (умное ожидание)
                        # Либо просто короткий слип, так как Google Maps тяжелый
                        await page.wait_for_timeout(700)
                    except:
                        pass

                # В. ЭКСТРАКЦИЯ ДАННЫХ (Оптом через JS)
                # Это работает в 10 раз быстрее, чем перебор в Python
                new_reviews = await page.evaluate(
                    """() => {
                    const results = [];
                    const blocks = document.querySelectorAll('div[data-review-id]');
                    blocks.forEach(el => {
                        // Ищем текст. Класс .wiI7pd или span
                        const textEl = el.querySelector('.wiI7pd, span[dir="ltr"]');
                        if (textEl) {
                            results.push(textEl.innerText.replace(/\\n/g, ' ').trim());
                        }
                    });
                    return results;
                }"""
                )

                prev_len = len(reviews_set)
                for r in new_reviews:
                    if r:
                        reviews_set.add(r)

                # Если набрали достаточно
                if len(reviews_set) >= max_reviews:
                    break

                # Проверка на зависание
                if len(reviews_set) == prev_len:
                    no_new_reviews_count += 1
                    # Пробуем "пнуть" скролл колесом, если JS scroll не триггерит загрузку (бывает защита)
                    if no_new_reviews_count > 2:
                        await page.locator(scrollable_selector).first.hover()
                        await page.mouse.wheel(0, 3000)
                        await page.wait_for_timeout(1000)

                    if no_new_reviews_count > 5:
                        print("🛑 Больше не грузится.")
                        break
                else:
                    no_new_reviews_count = 0

                print(f"   ⚡ Собрано: {len(reviews_set)}")

            result["reviews"] = list(reviews_set)
            result["reviews_count"] = len(reviews_set)
            coords = extract_coords_from_url(url)
            result["location"] = coords

        except Exception as e:
            print(f"🔥 Ошибка: {e}")
        finally:
            await browser.close()

    return result
