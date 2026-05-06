async function generatePDF() {
  try {

    const data = {
      landlord: document.getElementById("landlord").value,
      tenant: document.getElementById("tenant").value,
      address: document.getElementById("address").value,
      usage: document.getElementById("usage").value,
      rent: document.getElementById("rent").value,
      deposit: document.getElementById("deposit").value,
      months: document.getElementById("months").value,
      start: document.getElementById("start").value,
      payment: document.getElementById("payment").value,
      location: document.getElementById("location").value,
      today: new Date().toLocaleDateString()
    };

    const template = await loadTemplate();
    const html = template.replace(/{{(.*?)}}/g, (_, key) => {
      return data[key.trim()] || "";
    });

    const container = document.createElement("div");
    container.innerHTML = html;

    // 👇 关键：确保可见（否则可能空白）
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.background = "white";
    container.style.zIndex = "-1";

    document.body.appendChild(container);

    await html2pdf()
      .from(container)
      .set({
        margin: 15,
        filename: "lease_contract.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4" }
      })
      .save();

    document.body.removeChild(container);

  } catch (err) {
    alert("出错了：" + err.message);
    console.error(err);
  }
}
