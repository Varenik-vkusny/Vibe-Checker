import re
import asyncio
from playwright.async_api import async_playwright


def extract_coords_from_url(url: str):
    """Извлекает координаты из URL Google Maps"""
    match = re.search(r"@([-.\d]+),([-.\d]+)", url)
    if match:
        return {"lat": float(match.group(1)), "lon": float(match.group(2))}
    return {"lat": None, "lon": None}


async def parse_google_reviews(url: str, max_reviews: int = 50):
    """
    Парсит отзывы из Google Maps с автоматическим открытием места

    Args:
        url: URL места в Google Maps
        max_reviews: Максимальное количество отзывов для сбора
    """
    print(f"🚀 [PARSER] Запуск парсинга: {url}")

    # Добавляем язык в URL
    target_url = url
    if "google.com/maps" in url and "hl=en" not in url:
        separator = "&" if "?" in url else "?"
        target_url = f"{url}{separator}hl=en"

    result = {
        "place_name": "Unknown Place",
        "rating": "0.0",
        "reviews_count": 0,
        "reviews": [],
        "location": {"lat": None, "lon": None},
    }

    async with async_playwright() as p:
        browser = None
        try:
            # Запуск браузера
            browser = await p.chromium.launch(
                headless=True,  # Можешь поставить False для отладки
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--disable-gpu",
                    "--disable-dev-shm-usage",
                ],
            )

            context = await browser.new_context(
                locale="en-US",
                timezone_id="America/New_York",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1920, "height": 1080},
            )
            page = await context.new_page()

            # Переход на страницу
            print("📄 [PARSER] Загрузка страницы...")
            await page.goto(target_url, timeout=90000, wait_until="domcontentloaded")
            await page.wait_for_timeout(4000)

            # Принятие куки
            try:
                cookie_buttons = page.locator(
                    'button:has-text("Accept"), button:has-text("Reject"), button:has-text("OK")'
                )
                if await cookie_buttons.first.is_visible(timeout=3000):
                    await cookie_buttons.first.click()
                    await page.wait_for_timeout(1000)
            except:
                pass

            # === ПРОВЕРЯЕМ: ОТКРЫТА ЛИ БОКОВАЯ ПАНЕЛЬ ===
            print("🔍 [PARSER] Проверяем состояние страницы...")

            # Проверяем наличие боковой панели с информацией о месте
            sidebar_visible = await page.evaluate(
                """() => {
                // Ищем боковую панель с названием места
                const sidebar = document.querySelector('div[role="main"]');
                const h1 = document.querySelector('h1');
                return !!(sidebar && h1 && h1.textContent.trim().length > 0);
            }"""
            )

            if not sidebar_visible:
                print("⚠️ Боковая панель не открыта, ищем и кликаем по месту...")

                # Способ 1: Клик по названию места в поиске/карте
                try:
                    place_link = page.locator(
                        'a[href*="place/"], div[data-result-index]'
                    ).first
                    if await place_link.is_visible(timeout=5000):
                        await place_link.click()
                        print("✅ Кликнули по месту")
                        await page.wait_for_timeout(4000)
                except Exception as e:
                    print(f"   Способ 1 не сработал: {e}")

                # Способ 2: Клик по маркеру на карте через координаты
                if not sidebar_visible:
                    try:
                        # Извлекаем координаты из URL
                        coords = extract_coords_from_url(url)
                        if coords["lat"] and coords["lon"]:
                            print(
                                f"   Пробуем кликнуть на карте по координатам: {coords}"
                            )

                            # Ждем загрузки карты
                            await page.wait_for_selector(
                                'canvas, div[role="region"]', timeout=10000
                            )
                            await page.wait_for_timeout(2000)

                            # Клик по центру карты (где должен быть маркер)
                            await page.mouse.click(700, 400)
                            await page.wait_for_timeout(3000)
                            print("✅ Кликнули на карте")
                    except Exception as e:
                        print(f"   Способ 2 не сработал: {e}")

                # Способ 3: Поиск по кнопке с названием места
                try:
                    buttons = await page.locator("button, a").all()
                    for btn in buttons[:50]:
                        text = await btn.inner_text()
                        if text and len(text) > 3 and len(text) < 100:
                            if "restaurant" in text.lower() or "farhi" in text.lower():
                                await btn.click()
                                print(f"✅ Кликнули по: {text}")
                                await page.wait_for_timeout(3000)
                                break
                except:
                    pass

            # Еще раз ждем загрузки после клика
            await page.wait_for_timeout(3000)

            # === ПАРСИНГ НАЗВАНИЯ ===
            print("\n📍 [PARSER] Поиск названия заведения...")
            try:
                place_name = await page.evaluate(
                    """() => {
                    // Способ 1: H1
                    const h1s = Array.from(document.querySelectorAll('h1'));
                    for (let h1 of h1s) {
                        const text = h1.textContent.trim();
                        if (text && text !== 'Google Maps' && text.length > 0 && text.length < 100) {
                            return text;
                        }
                    }
                    
                    // Способ 2: В поисковой строке
                    const searchBox = document.querySelector('input[aria-label*="Search"]');
                    if (searchBox && searchBox.value) {
                        return searchBox.value.replace(/^restaurant\\s+/i, '').trim();
                    }
                    
                    // Способ 3: Из title страницы
                    const title = document.title;
                    if (title && title !== 'Google Maps') {
                        return title.replace(' - Google Maps', '').split('·')[0].trim();
                    }
                    
                    return null;
                }"""
                )

                if place_name:
                    result["place_name"] = place_name
                    print(f"✅ Название: {result['place_name']}")
            except Exception as e:
                print(f"⚠️ Ошибка парсинга названия: {e}")

            # === ПАРСИНГ РЕЙТИНГА ===
            print("⭐ [PARSER] Поиск рейтинга...")
            try:
                rating = await page.evaluate(
                    """() => {
                    // Способ 1: Элемент со звездами
                    const starEl = document.querySelector('[role="img"][aria-label*="star"]');
                    if (starEl) {
                        const label = starEl.getAttribute('aria-label');
                        const match = label.match(/([0-9]+[.,][0-9]+)/);
                        if (match) return match[1].replace(',', '.');
                    }
                    
                    // Способ 2: Класс F7nice
                    const ratingEl = document.querySelector('.F7nice');
                    if (ratingEl) {
                        const match = ratingEl.textContent.match(/([0-9]+[.,][0-9]+)/);
                        if (match) return match[1].replace(',', '.');
                    }
                    
                    // Способ 3: Любой span с рейтингом
                    const spans = Array.from(document.querySelectorAll('span'));
                    for (let span of spans) {
                        const text = span.textContent.trim();
                        if (/^[0-9]\.[0-9]$/.test(text)) {
                            return text;
                        }
                    }
                    
                    return null;
                }"""
                )

                if rating:
                    result["rating"] = rating
                    print(f"✅ Рейтинг: {result['rating']}")
            except Exception as e:
                print(f"⚠️ Ошибка рейтинга: {e}")

            # === ОТКРЫТИЕ ВКЛАДКИ REVIEWS ===
            print("\n📝 [PARSER] Открытие вкладки Reviews...")
            reviews_opened = False

            try:
                # Ищем таб "Reviews"
                tabs = await page.locator('button[role="tab"], div[role="tab"]').all()
                for tab in tabs:
                    text = await tab.inner_text()
                    aria_label = await tab.get_attribute("aria-label")

                    if "review" in text.lower() or (
                        aria_label and "review" in aria_label.lower()
                    ):
                        await tab.click()
                        print(f"✅ Открыли таб: {text or aria_label}")
                        await page.wait_for_timeout(3000)
                        reviews_opened = True
                        break
            except Exception as e:
                print(f"⚠️ Не удалось найти таб Reviews: {e}")

            # Альтернатива: клик по тексту "Reviews"
            if not reviews_opened:
                try:
                    await page.click("text=/reviews/i", timeout=3000)
                    await page.wait_for_timeout(3000)
                    reviews_opened = True
                    print("✅ Кликнули по тексту Reviews")
                except:
                    pass

            # === ПОИСК КОНТЕЙНЕРА С ОТЗЫВАМИ ===
            print("🔍 [PARSER] Поиск контейнера отзывов...")
            scrollable_selector = None

            possible_selectors = [
                'div[role="feed"]',
                'div[aria-label*="Reviews"]',
                "div.m6QErb.DxyBCb.kA9KIf.dS8AEf",
                ".m6QErb",
            ]

            for selector in possible_selectors:
                count = await page.locator(selector).count()
                if count > 0:
                    scrollable_selector = selector
                    print(f"✅ Контейнер: {selector}")
                    break

            if not scrollable_selector:
                print("❌ Контейнер не найден!")
                # Пытаемся все равно получить хоть что-то
                result["location"] = extract_coords_from_url(page.url)
                return result

            # === СБОР ОТЗЫВОВ ===
            print(f"\n📜 [PARSER] Сбор отзывов (цель: {max_reviews})...")
            reviews_set = set()
            no_change_count = 0

            for attempt in range(100):
                # Раскрываем кнопки "More"
                await page.evaluate(
                    """() => {
                    const buttons = document.querySelectorAll('button[aria-label*="More"], button.w8nwRe');
                    buttons.forEach(btn => {
                        if (btn.offsetParent !== null) {
                            try { btn.click(); } catch(e) {}
                        }
                    });
                }"""
                )

                await page.wait_for_timeout(300)

                # Скролл
                await page.evaluate(
                    f"""(selector) => {{
                    const container = document.querySelector(selector);
                    if (container) {{
                        container.scrollTop = container.scrollHeight;
                    }}
                }}""",
                    scrollable_selector,
                )

                await page.wait_for_timeout(1200)

                # Собираем отзывы
                current_reviews = await page.evaluate(
                    """() => {
                    const reviewEls = document.querySelectorAll('div[data-review-id]');
                    const reviews = [];
                    
                    reviewEls.forEach(el => {
                        const textEl = el.querySelector('.wiI7pd, .MyEned');
                        if (textEl) {
                            const text = textEl.textContent.trim();
                            if (text.length > 5) {
                                reviews.push(text);
                            }
                        }
                    });
                    
                    return reviews;
                }"""
                )

                prev_count = len(reviews_set)
                reviews_set.update(current_reviews)
                new_count = len(reviews_set)

                if attempt % 5 == 0 or new_count != prev_count:
                    print(
                        f"📊 Попытка {attempt + 1}: {new_count} отзывов (+{new_count - prev_count})"
                    )

                if new_count >= max_reviews:
                    print(f"✅ Цель достигнута: {new_count}")
                    break

                if new_count == prev_count:
                    no_change_count += 1
                    if no_change_count >= 7:
                        print(f"⚠️ Конец списка")
                        break
                else:
                    no_change_count = 0

            result["reviews"] = list(reviews_set)[:max_reviews]
            result["reviews_count"] = len(result["reviews"])
            result["location"] = extract_coords_from_url(page.url)

            print(f"\n🎉 ГОТОВО!")
            print(f"   📍 {result['place_name']}")
            print(f"   ⭐ {result['rating']}")
            print(f"   💬 {result['reviews_count']} отзывов")

        except Exception as e:
            print(f"❌ Ошибка: {e}")
            import traceback

            traceback.print_exc()

        finally:
            if browser:
                await browser.close()

    return result
