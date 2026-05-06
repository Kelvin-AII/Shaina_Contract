async function loadTemplate() {
  const res = await fetch('lease-template.html');
  return await res.text();
}

function renderTemplate(template, data) {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    return data[key.trim()] || "";
  });
}

async function generatePDF() {

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
    location: document.getElementById("location").value
  };

  const template = await loadTemplate();
  const html = renderTemplate(template, data);

  const container = document.createElement("div");
  container.innerHTML = html;

  document.body.appendChild(container);

  html2pdf()
    .from(container)
    .set({
      margin: 15,
      filename: "lease_contract.pdf",
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4" }
    })
    .save()
    .then(() => {
      document.body.removeChild(container);
    });
}
