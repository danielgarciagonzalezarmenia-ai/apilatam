const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

admin.initializeApp();

const db = admin.firestore();

const FREE_LIMIT = 100;

function getUserByApiKey(apiKey) {
  return db.collection("users").where("apiKey", "==", apiKey).limit(1).get()
    .then(snap => {
      if (snap.empty) return null;
      const doc = snap.docs[0];
      return { id: doc.id, ...doc.data() };
    });
}

async function checkRateLimit(user) {
  if (user.plan === "pro") return true;

  const today = new Date().toISOString().split("T")[0];

  if (user.lastRequestDate !== today) {
    await db.collection("users").doc(user.id).update({
      requestsToday: 1,
      lastRequestDate: today
    });
    return true;
  }

  if (user.requestsToday >= FREE_LIMIT) return false;

  await db.collection("users").doc(user.id).update({
    requestsToday: admin.firestore.FieldValue.increment(1)
  });
  return true;
}

function extractApiKey(req) {
  const headerKey = req.headers["x-api-key"];
  if (headerKey) return headerKey;

  const url = new URL(req.url, `https://${req.headers.host}`);
  return url.searchParams.get("api_key");
}

function sendJson(res, status, data) {
  res.set("Content-Type", "application/json");
  res.status(status).json(data);
}

exports.api = onRequest(async (req, res) => {
  cors(req, res, async () => {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const path = url.pathname.replace("/api", "");
    const method = req.method;

    if (path === "/health") {
      return sendJson(res, 200, { status: "ok", timestamp: new Date().toISOString() });
    }

    const apiKey = extractApiKey(req);
    if (!apiKey) {
      return sendJson(res, 401, { error: "API key requerida. Usa el header x-api-key o el parametro ?api_key=" });
    }

    const user = await getUserByApiKey(apiKey);
    if (!user) {
      return sendJson(res, 403, { error: "API key invalida." });
    }

    const allowed = await checkRateLimit(user);
    if (!allowed) {
      return sendJson(res, 429, { error: "Limite diario alcanzado. Actualiza a Pro para requests ilimitados." });
    }

    try {
      if (path === "/channels" && method === "GET") {
        const category = url.searchParams.get("category");
        let q = db.collection("channels").where("status", "==", "online");
        if (category) q = q.where("category", "==", category);

        const snap = await q.get();
        let items = snap.docs.map(d => ({
          id: d.id,
          name: d.data().name,
          imageUrl: d.data().imageUrl,
          m3u8Url: d.data().m3u8Url,
          category: d.data().category
        }));

        if (user.plan === "free") {
          items = items.slice(0, 20);
        }

        return sendJson(res, 200, { channels: items, total: items.length, plan: user.plan });
      }

      if (path.startsWith("/channels/") && method === "GET") {
        const id = path.split("/")[2];
        const docSnap = await db.collection("channels").doc(id).get();
        if (!docSnap.exists) return sendJson(res, 404, { error: "Canal no encontrado" });

        const data = docSnap.data();
        return sendJson(res, 200, {
          id: docSnap.id,
          name: data.name,
          imageUrl: data.imageUrl,
          m3u8Url: data.m3u8Url,
          category: data.category
        });
      }

      if (path === "/movies" && method === "GET") {
        const category = url.searchParams.get("category");
        let q = db.collection("movies").where("status", "==", "online");
        if (category) q = q.where("category", "==", category);

        const snap = await q.get();
        let items = snap.docs.map(d => ({
          id: d.id,
          name: d.data().name,
          imageUrl: d.data().imageUrl,
          m3u8Url: d.data().m3u8Url,
          category: d.data().category
        }));

        if (user.plan === "free") {
          items = items.slice(0, 20);
        }

        return sendJson(res, 200, { movies: items, total: items.length, plan: user.plan });
      }

      if (path.startsWith("/movies/") && method === "GET") {
        const id = path.split("/")[2];
        const docSnap = await db.collection("movies").doc(id).get();
        if (!docSnap.exists) return sendJson(res, 404, { error: "Pelicula no encontrada" });

        const data = docSnap.data();
        return sendJson(res, 200, {
          id: docSnap.id,
          name: data.name,
          imageUrl: data.imageUrl,
          m3u8Url: data.m3u8Url,
          category: data.category
        });
      }

      if (path === "/categories" && method === "GET") {
        const snap = await db.collection("categories").get();
        const items = snap.docs.map(d => ({
          id: d.id,
          name: d.data().name,
          type: d.data().type
        }));
        return sendJson(res, 200, { categories: items, total: items.length });
      }

      return sendJson(res, 404, { error: "Endpoint no encontrado" });

    } catch (error) {
      console.error("API Error:", error);
      return sendJson(res, 500, { error: "Error interno del servidor" });
    }
  });
});
