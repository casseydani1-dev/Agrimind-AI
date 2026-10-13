function showSection(id) {
  document.querySelectorAll(".panel").forEach(panel => {
    panel.classList.add("hidden");
  });
  document.getElementById(id).classList.remove("hidden");
}

function addMessage(text, type) {
  const box = document.getElementById("chatBox");
  const message = document.createElement("div");
  message.className = "message " + type;
  message.textContent = text;
  box.appendChild(message);
  box.scrollTop = box.scrollHeight;
  return message;
}

async function askAI() {
  const question = document.getElementById("question").value.trim();
  const image = document.getElementById("chatImage").files[0];

  if (!question && !image) {
    alert("Enter a question or upload an image.");
    return;
  }
  if (image && image.size > 10 * 1024 * 1024) {
    alert("Please upload an image smaller than 10 MB.");
    return;
  }

  if (question) addMessage(question, "user");
  if (image) addMessage("Image attached: " + image.name, "user");

  document.getElementById("question").value = "";
  document.getElementById("chatImage").value = "";

  const loading = addMessage("Researching your question...", "ai");

  try {
    const form = new FormData();
    form.append("question", question || "Analyze this agricultural image.");
    if (image) form.append("image", image);

    const response = await fetch("/api/ask", {
      method: "POST",
      body: form
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");

    loading.textContent = data.answer || "No answer was returned.";

    if (data.images && data.images.length) {
      const box = document.createElement("div");
      data.images.forEach(item => {
        const link = document.createElement("a");
        link.href = item.page;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        const img = document.createElement("img");
        img.src = item.url;
        img.alt = item.title || "Agricultural image";
        img.className = "result-image";
        img.loading = "lazy";

        link.appendChild(img);
        box.appendChild(link);
      });
      loading.appendChild(box);
    }

    if (data.sources && data.sources.length) {
      const title = document.createElement("p");
      title.textContent = "Sources:";
      loading.appendChild(title);

      data.sources.forEach(source => {
        const link = document.createElement("a");
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = source.title || source.url;
        link.style.display = "block";
        loading.appendChild(link);
      });
    }
  } catch (error) {
    loading.textContent = "Error: " + error.message;
  }
}

async function analyzePlant() {
  const image = document.getElementById("plantImage").files[0];
  const result = document.getElementById("plantResult");

  if (!image) {
    alert("Please select a plant image.");
    return;
  }
  if (image.size > 10 * 1024 * 1024) {
    alert("Please upload an image smaller than 10 MB.");
    return;
  }

  result.textContent = "Analyzing your plant image...";

  try {
    const form = new FormData();
    form.append("question",
      "Analyze this plant image. Identify the crop if possible, describe visible symptoms, discuss possible causes, suggest practical next steps, and explain what additional information would help confirm the diagnosis. Do not claim certainty from an image alone."
    );
    form.append("image", image);

    const response = await fetch("/api/ask", {
      method: "POST",
      body: form
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Analysis failed.");

    result.textContent = data.answer || "No analysis returned.";
  } catch (error) {
    result.textContent = "Error: " + error.message;
  }
}

async function getWeather() {
  const location = document.getElementById("location").value.trim();
  const result = document.getElementById("weatherResult");

  if (!location) {
    alert("Enter a town or city.");
    return;
  }

  result.textContent = "Getting weather information...";

  try {
    const search = await fetch(
      "https://geocoding-api.open-meteo.com/v1/search?name=" +
      encodeURIComponent(location) + "&count=1&language=en&format=json"
    );
    const geo = await search.json();
    if (!geo.results || !geo.results.length) {
      throw new Error("Location not found.");
    }

    const place = geo.results[0];
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}` +
      `&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m`
    );
    const data = await response.json();
    const weather = data.current;

    result.textContent =
      `${place.name}: ${weather.temperature_2m}°C | ` +
      `Humidity: ${weather.relative_humidity_2m}% | ` +
      `Precipitation: ${weather.precipitation} mm | ` +
      `Wind: ${weather.wind_speed_10m} km/h. ` +
      "Check local field conditions before making spraying or irrigation decisions.";
  } catch (error) {
    result.textContent = "Weather error: " + error.message;
  }
}

function calculateProfit() {
  const revenue = Number(document.getElementById("revenue").value);
  const expenses = Number(document.getElementById("expenses").value);
  const result = document.getElementById("profitResult");

  if (!Number.isFinite(revenue) || !Number.isFinite(expenses) ||
      revenue < 0 || expenses < 0) {
    result.textContent = "Enter valid, non-negative amounts.";
    return;
  }

  const profit = revenue - expenses;
  result.textContent =
    `Net ${profit >= 0 ? "profit" : "loss"}: ₦${Math.abs(profit).toLocaleString()}`;
}
