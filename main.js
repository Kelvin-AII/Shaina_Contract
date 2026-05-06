// =========================
// 1. 加载模板
// =========================
async function loadTemplate() {
  const res = await fetch('lease-template.html');

  console.log("模板加载状态:", res.status);

  if (!res.ok) {
    throw new Error("模板加载失败（请检查路径或 GitHub Pages）");
  }

  return await res.text();
}

// =========================
// 2. 模板渲染（核心）
// =========================
function renderTemplate(template, data) {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    return data[key.trim()] || "";
  });
}

// =========================
// 3. 获取当前日期
// =========================
function getDateData() {
  const d = new Date();

  return {
    day: d.getDate(),
    month: d.toLocaleString('en-US', { month: 'long' }),
    year: d.getFullYear(),
    day_cn: d.getDate(),
    month_cn: d.getMonth() + 1
  };
}

// =========================
// 4. 收集表单数据
// =========================
function getFormData() {
  return {
    tenant: document.getElementById("tenant")?.value || "",
    id: document.getElementById("id")?.value || "",
    address: document.getElementById("address")?.value || "",
    period: document.getElementById("period")?.value || "",
    rent: document.getElementById("rent")?.value || "",
    deposit: document.getElementById("deposit")?.value || "",
    total: document.getElementById("total")?.value || ""
  };
}

// =========================
// 5. 自动计算总费用（可选）
// =========================
function calculateTotal(rent, months) {
  const r = parseFloat(rent) || 0;
  const m = parseFloat(months) || 0;
  return r * m;
}

// =========================
// 6. 生成 PDF（主函数）
// =========================
async function generatePDF() {
  try {

    // 👉 获取数据
    const formData = getFormData();
    const dateData = getDateData();

    // 👉 合并数据
    const data = {
      ...formData,
      ...dateData
    };

    // 👉 自动算 total（如果没填）
    if (!data.total && data.rent && data.period) {
      const months = parseInt(data.period);
      data.total = calculateTotal(data.rent, months);
    }

    console.log("最终数据:", data);

    // 👉 加载模板
    const template = await loadTemplate();

    // 👉 渲染 HTML
    const html = renderTemplate(template, data);

    // 👉 创建容器
    const container = document.createElement("div");
    container.innerHTML = html;

    // 👉 防止 PDF 空白（关键）
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "800px";
    container.style.background = "#fff";
    container.style.zIndex = "-1";

    document.body.appendChild(container);

    // 👉 生成 PDF
    await html2pdf()
      .from(container)
      .set({
        margin: 15,
        filename: "lease_contract.pdf",
        pagebreak: { mode: ['css', 'legacy'] }, // ⭐关键
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4" }
      })
      .save();

    // 👉 清理 DOM
    document.body.removeChild(container);

  } catch (err) {
    console.error(err);
    alert("生成失败：" + err.message);
  }
}

// =========================
// 7. 页面加载调试
// =========================
window.addEventListener("load", () => {
  console.log("页面加载完成 ✅");
});
