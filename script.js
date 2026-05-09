// Використовуємо 1.5-flash, бо у неї найбільша безкоштовна квота
const MODEL_NAME = "gemini-robotics-er-1.6-preview"; 

async function callGemini(key, text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${key.trim()}`;
    
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: text }] }]
        })
    });

    const data = await response.json();

    if (!response.ok) {
        // Обробка помилки квоти (забагато запитів)
        if (response.status === 429) {
            throw new Error("Забагато запитів! Будь ласка, зачекайте 30-60 секунд.");
        }
        // Обробка помилки регіону (якщо VPN не працює)
        if (data.error?.message.includes("location is not supported")) {
            throw new Error("Google AI недоступний у вашому регіоні. Будь ласка, увімкніть VPN (США або Європа).");
        }
        throw new Error(data.error?.message || "Помилка API");
    }

    return data.candidates[0].content.parts[0].text;
}

// Чекаємо завантаження сторінки
window.onload = function() {
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const apiKeyField = document.getElementById('apiKey');
    const promptField = document.getElementById('userPrompt');

    console.log("Система готова до роботи. Кнопки підключено.");

    // ЛОГІКА ЗАПУСКУ (Кнопка "ЗАПУСТИТИ")
    if (startBtn) {
        startBtn.onclick = async function() {
            const key = apiKeyField.value.trim();
            const idea = promptField.value.trim();

            if (!key || !idea) {
                alert("Будь ласка, вставте API-ключ та опишіть ідею!");
                return;
            }

            // Блокуємо кнопку на час роботи
            startBtn.disabled = true;
            startBtn.innerText = "ШІ працює... Зачекайте";

            try {
                // ПРАЦЮЄ АГЕНТ 1: Сценарист
                document.getElementById('status1').innerText = "Сценарист пише текст... ✍️";
                document.getElementById('status1').style.color = "blue";
                const writerResult = await callGemini(key, "Ти професійний сценарист ігор. Створи детальний концепт для ідеї: " + idea);
                document.getElementById('content1').innerText = writerResult;
                document.getElementById('status1').innerText = "Готово ✅";
                document.getElementById('status1').style.color = "green";

                // ПРАЦЮЄ АГЕНТ 2: Критик
                document.getElementById('status2').innerText = "Критик аналізує... 🧐";
                document.getElementById('status2').style.color = "blue";
                const criticResult = await callGemini(key, "Ти суворий ігровий критик. Проаналізуй цей сценарій, знайди слабкі місця та дай поради: " + writerResult);
                document.getElementById('content2').innerText = criticResult;
                document.getElementById('status2').innerText = "Аналіз завершено ✅";
                document.getElementById('status2').style.color = "green";

            } catch (err) {
                console.error("Помилка:", err);
                alert("Сталася помилка: " + err.message);
                document.getElementById('status1').innerText = "Помилка ❌";
                document.getElementById('status2').innerText = "Помилка ❌";
            } finally {
                // Повертаємо кнопку в активний стан
                startBtn.disabled = false;
                startBtn.innerText = "ЗАПУСТИТИ РОЗРОБКУ";
            }
        };
    }

    // ЛОГІКА ОЧИЩЕННЯ (Кнопка "ОЧИСТИТИ ВСЕ")
    if (resetBtn) {
        resetBtn.onclick = function() {
            // Очищаємо лише ідею та результати, ключ залишаємо для зручності
            promptField.value = "";
            document.getElementById('content1').innerText = "";
            document.getElementById('content2').innerText = "";
            
            document.getElementById('status1').innerText = "Очікування...";
            document.getElementById('status1').style.color = "gray";
            document.getElementById('status2').innerText = "Очікування...";
            document.getElementById('status2').style.color = "gray";
            
            console.log("Екран очищено для нового запиту.");
        };
    }
};