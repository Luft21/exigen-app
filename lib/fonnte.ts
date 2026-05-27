export async function sendWhatsAppMessage(target: string, message: string, delayMs: number = 3000) {
  const token = process.env.FONNTE_TOKEN;
  
  if (!token) {
    console.error("FONNTE_TOKEN belum di-set di .env");
    return false;
  }

  // Jeda eksekusi (Delay) untuk menghindari blokir antispam dari Fonnte / WhatsApp
  if (delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  try {
    const formData = new FormData();
    formData.append("target", target);
    formData.append("message", message);
    // Jika butuh delay bawaan Fonnte, bisa pakai formData.append("delay", "2");

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": token,
      },
      body: formData,
    });

    const result = await response.json();
    console.log("Fonnte Send Result:", result);
    return result.status;
  } catch (error) {
    console.error("Error sending Fonnte message:", error);
    return false;
  }
}
