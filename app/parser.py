import re
from playwright.async_api import async_playwright


async def parse_google_reviews(url: str, max_reviews: int = 50):
    """
    Парсит отзывы с Google Maps.
    Args:
        url: Ссылка на место (любая, даже грязная).
        max_reviews: Сколько отзывов собрать (стандарт 50).
    Returns:
        dict: { "title": str, "rating": str, "reviews": list[str] }
    """
    print(f"🚀 [PARSER] Запуск для: {url}")

    # 1. Форсируем английский
    if "?" in url:
        url += "&hl=en"
    else:
        url += "?hl=en"

    reviews_data = set()
    place_title = "Unknown Place"
    place_rating = "0.0"

    async with async_playwright() as p:
        # ЗАПУСК В СТЕЛС-РЕЖИМЕ
        browser = await p.chromium.launch(
            headless=True,
            args=[
                "--start-maximized",
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],
        )
        context = await browser.new_context(no_viewport=True, locale="en-US")

        # Скрываем webdriver
        await context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
        )

        page = await context.new_page()

        try:
            # --- 1. ЗАГРУЗКА ---
            print("⏳ [PARSER] Загрузка страницы...")
            await page.goto(url, timeout=60000, wait_until="domcontentloaded")

            # Закрываем куки
            try:
                await page.locator("button").filter(
                    has_text=re.compile(r"Accept|Agree")
                ).first.click(timeout=3000)
            except:
                pass

            # Берем название места
            try:
                place_title = await page.locator("h1").first.inner_text()
                # Пытаемся взять рейтинг
                rating_el = (
                    page.locator('div[role="img"]')
                    .filter(has_text=re.compile(r"^\d\.\d"))
                    .first
                )
                if await rating_el.is_visible():
                    place_rating = await rating_el.get_attribute("aria-label")
                    place_rating = place_rating.split(" ")[0]
            except:
                print("⚠️ Не смог достать название/рейтинг, но продолжаем.")

            # --- 2. ВХОД В ОТЗЫВЫ ---
            print("🔍 [PARSER] Переход к отзывам...")

            reviews_tab = page.locator('[role="tab"]').filter(has_text="Reviews").first
            if not await reviews_tab.is_visible():
                reviews_tab = page.get_by_text("Reviews", exact=True).first

            if await reviews_tab.is_visible():
                await reviews_tab.click(force=True)
                try:
                    await page.locator('button[aria-label*="Sort"]').wait_for(
                        timeout=5000
                    )
                    print("✅ [PARSER] Успешно вошли в отзывы!")
                except:
                    print("⚠️ Кнопка Sort не появилась, но пробуем парсить...")
            else:
                print("❌ [PARSER] Кнопка Reviews не найдена.")
                return None

            # --- 3. СКРОЛЛИНГ И СБОР ---
            print(f"📜 [PARSER] Сбор {max_reviews} отзывов...")

            first_review = page.locator("div[data-review-id]").first
            await first_review.wait_for(timeout=10000)

            feed_container = page.locator('div[role="feed"]').first
            use_js_scroll = await feed_container.count() > 0

            fails = 0
            prev_count = 0

            while len(reviews_data) < max_reviews:
                # А. Раскрываем кнопки "More" (ИСПРАВЛЕНО)
                # await ... .all() возвращает список, теперь по нему можно итерироваться
                more_btns = (
                    await page.locator("button")
                    .filter(has_text=re.compile(r"^More|See more", re.IGNORECASE))
                    .all()
                )

                for btn in more_btns:
                    try:
                        if await btn.is_visible():
                            await btn.click(timeout=200)
                    except:
                        pass

                # Б. Парсим текст
                elements = await page.locator("div[data-review-id] .wiI7pd").all()

                for el in elements:
                    try:
                        text = await el.inner_text()
                        clean_text = text.replace("\n", " ").strip()
                        if len(clean_text) > 5:
                            reviews_data.add(clean_text)
                    except:
                        continue

                print(f"   🔄 Собрано: {len(reviews_data)}")

                if len(reviews_data) >= max_reviews:
                    break

                # В. Скроллим
                if use_js_scroll:
                    await feed_container.evaluate(
                        "el => el.scrollTop = el.scrollHeight"
                    )
                else:
                    if elements:
                        await elements[-1].hover()
                        await page.mouse.wheel(0, 3000)

                await page.wait_for_timeout(2000)

                # Проверка на конец списка
                if len(reviews_data) == prev_count:
                    fails += 1
                    if fails > 3:
                        print("🛑 Больше не грузится.")
                        break
                else:
                    fails = 0
                prev_count = len(reviews_data)

        except Exception as e:
            print(f"🔥 [PARSER ERROR] {e}")
            return None
        finally:
            await browser.close()

    result = {
        "place_name": place_title,
        "rating": place_rating,
        "reviews_count": len(reviews_data),
        "reviews": list(reviews_data),
    }

    print(f"✅ [PARSER] Финиш! {result['place_name']} ({result['reviews_count']} шт.)")
    return result
