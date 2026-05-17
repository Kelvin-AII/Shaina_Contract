(function () {
  "use strict";

  const FIELD_IDS = [
    "address",
    "checkin",
    "checkout",
    "signDate",
    "rent",
    "name",
    "idNumber",
    "period",
    "deposit",
    "depositDeadline",
    "p1Date",
    "p2Date",
    "p3Date",
    "p4Date",
    "p1Rent",
    "p2Rent",
    "p3Rent",
    "p4Rent"
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function getValue(id) {
    const el = $(id);
    return el ? String(el.value || "").trim() : "";
  }

  function setValue(id, value) {
    const el = $(id);
    if (el) {
      el.value = value == null ? "" : String(value);
    }
  }

  function normalizeNumber(value) {
    if (value == null) return 0;

    const text = String(value).replace(/[^\d.-]/g, "");
    const num = Number(text);

    return Number.isFinite(num) ? num : 0;
  }

  function money(value) {
    const num = normalizeNumber(value);

    if (!num) return "";

    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  function normalizeDateInput(value) {
    if (!value) return "";

    let text = String(value).trim();

    text = text
      .replace(/[年月]/g, "-")
      .replace(/[日号]/g, "")
      .replace(/[./]/g, "-")
      .replace(/\s+/g, "");

    const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

    if (!match) return value;

    const year = match[1];
    const month = match[2].padStart(2, "0");
    const day = match[3].padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function parseDate(value) {
    const normalized = normalizeDateInput(value);
    const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);

    const date = new Date(year, month, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  function formatDate(value) {
    const date = value instanceof Date ? value : parseDate(value);

    if (!date) return value || "";

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
  }

  function formatChineseDate(value) {
    const date = value instanceof Date ? value : parseDate(value);

    if (!date) return value || "";

    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function addMonths(date, months) {
    const d = new Date(date.getTime());
    const targetMonth = d.getMonth() + months;
    const originalDate = d.getDate();

    d.setDate(1);
    d.setMonth(targetMonth);

    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(originalDate, lastDay));

    return d;
  }

  function addDays(date, days) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function getMonthDiff(startValue, endValue) {
    const start = parseDate(startValue);
    const end = parseDate(endValue);

    if (!start || !end || end <= start) return 0;

    let months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    if (end.getDate() > start.getDate()) {
      months += 1;
    }

    return Math.max(months, 0);
  }

  function extractField(raw, labels) {
    if (!raw) return "";

    for (const label of labels) {
      const reg = new RegExp(`${label}\\s*[:：]?\\s*([^\\n\\r]+)`, "i");
      const match = raw.match(reg);

      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return "";
  }

  function parseInput() {
    const raw = getValue("rawInput");

    if (!raw) {
      alert("请先输入资料。");
      return;
    }

    const mapping = [
      {
        id: "address",
        labels: ["居住地址", "地址", "房屋地址", "物业地址", "單位地址", "单位地址"]
      },
      {
        id: "checkin",
        labels: ["入住日期", "开始日期", "起租日期", "入住", "開始日期"]
      },
      {
        id: "checkout",
        labels: ["退房日期", "结束日期", "完结日期", "到期日期", "退租日期", "結束日期"]
      },
      {
        id: "signDate",
        labels: ["签约日期", "簽約日期", "合同日期", "签署日期", "簽署日期"]
      },
      {
        id: "rent",
        labels: ["每月租金", "月租", "租金", "许可每月费用", "許可每月費用"]
      },
      {
        id: "name",
        labels: ["姓名", "租客姓名", "许可人姓名", "許可人姓名", "名字"]
      },
      {
        id: "idNumber",
        labels: ["证件号码", "證件號碼", "身份证", "身份證", "护照", "護照", "ID", "Passport"]
      }
    ];

    mapping.forEach(item => {
      const value = extractField(raw, item.labels);

      if (value) {
        if (["checkin", "checkout", "signDate"].includes(item.id)) {
          setValue(item.id, normalizeDateInput(value));
        } else if (item.id === "rent") {
          setValue(item.id, normalizeNumber(value) || value);
        } else {
          setValue(item.id, value);
        }
      }
    });

    calculate();
  }

  function calculate() {
    const checkin = parseDate(getValue("checkin"));
    const checkout = parseDate(getValue("checkout"));
    const rent = normalizeNumber(getValue("rent"));

    if (getValue("checkin")) {
      setValue("checkin", formatDate(getValue("checkin")));
    }

    if (getValue("checkout")) {
      setValue("checkout", formatDate(getValue("checkout")));
    }

    if (getValue("signDate")) {
      setValue("signDate", formatDate(getValue("signDate")));
    }

    if (!checkin || !checkout || !rent) {
      return;
    }

    const months = getMonthDiff(getValue("checkin"), getValue("checkout"));

    setValue("period", `${formatChineseDate(checkin)} 至 ${formatChineseDate(checkout)}`);

    setValue("deposit", rent * 2);
    setValue("depositDeadline", formatDate(addDays(checkin, -2)));

    const installmentCount = 4;
    const baseMonths = Math.floor(months / installmentCount);
    const remainder = months % installmentCount;

    const rents = [];

    for (let i = 0; i < installmentCount; i++) {
      const monthsForThisPeriod = baseMonths + (i < remainder ? 1 : 0);
      rents.push(monthsForThisPeriod * rent);
    }

    setValue("p1Date", formatDate(checkin));
    setValue("p2Date", formatDate(addMonths(checkin, Math.ceil(months / 4))));
    setValue("p3Date", formatDate(addMonths(checkin, Math.ceil(months / 2))));
    setValue("p4Date", formatDate(addMonths(checkin, Math.ceil((months * 3) / 4))));

    setValue("p1Rent", rents[0] || "");
    setValue("p2Rent", rents[1] || "");
    setValue("p3Rent", rents[2] || "");
    setValue("p4Rent", rents[3] || "");
  }

  function validateBeforeGenerate() {
    const required = [
      ["address", "居住地址"],
      ["checkin", "入住日期"],
      ["checkout", "退房日期"],
      ["signDate", "签约日期"],
      ["rent", "每月租金"],
      ["name", "姓名"],
      ["idNumber", "证件号码"]
    ];

    const missing = [];

    required.forEach(([id, label]) => {
      if (!getValue(id)) {
        missing.push(label);
      }
    });

    if (missing.length) {
      alert("请先填写以下字段：\n" + missing.join("、"));
      return false;
    }

    return true;
  }

  function collectFormData() {
    calculate();

    const form = {};

    FIELD_IDS.forEach(id => {
      form[id] = getValue(id);
    });

    const totalMonths = getMonthDiff(form.checkin, form.checkout);
    const rent = normalizeNumber(form.rent);
    const totalFee = totalMonths * rent;

    return {
      "居住地址": form.address,
      "入住日期": formatChineseDate(form.checkin),
      "退房日期": formatChineseDate(form.checkout),
      "签约日期": formatChineseDate(form.signDate),
      "每月租金": money(form.rent),
      "姓名": form.name,
      "证件号码": form.idNumber,
      "居住时期": form.period,
      "保证金": money(form.deposit),
      "保证金支付截止日期": formatChineseDate(form.depositDeadline),
      "第一期截止": formatChineseDate(form.p1Date),
      "第二期截止": formatChineseDate(form.p2Date),
      "第三期截止": formatChineseDate(form.p3Date),
      "第四期截止": formatChineseDate(form.p4Date),
      "第一期租金": money(form.p1Rent),
      "第二期租金": money(form.p2Rent),
      "第三期租金": money(form.p3Rent),
      "第四期租金": money(form.p4Rent),
      "总居住月份": totalMonths,
      "总许可费用": money(totalFee)
    };
  }

  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function renderTemplate(template, data) {
    let html = template;

    Object.keys(data).forEach(key => {
      const value = data[key] == null ? "" : String(data[key]);
      const reg = new RegExp(`#${escapeRegExp(key)}#`, "g");
      html = html.replace(reg, value);
    });

    html = html.replace(/#[^#]+#/g, "");

    return html;
  }

  function getContractTemplate() {
    return `
<div class="contract">
  <h1>许可协议</h1>

  <p>此合約由A1 Plus Global Limited及许可人（护照/身份证ID no. #证件号码#）於#签约日期#訂立。</p>

  <div class="meta">
    <div class="meta-row">
      <span class="meta-label">许可居住地址：</span>
      <span class="meta-value">#居住地址#</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">许可使用期間：</span>
      <span class="meta-value">#居住时期#</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">许可每月费用：</span>
      <span class="meta-value">#每月租金# HKD</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">许可保證金：</span>
      <span class="meta-value">#保证金# HKD</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">總许可费用：</span>
      <span class="meta-value">#总许可费用# HKD</span>
    </div>
  </div>

  <p class="intro">A1 Plus Global Limited 及许可人同意遵守及履行下列條款：</p>

  <div class="clause">
    <div class="clause-no">1.</div>
    <div class="clause-text">许可人不得轉讓、轉租或分租該许可居住地的物業或其任何部分或將該许可居住地的物業或其任何部分的佔用權讓予任何其他人等，此许可协议權益將為许可人擁有。</div>
  </div>

  <div class="clause">
    <div class="clause-no">2.</div>
    <div class="clause-text">许可人須遵守香港一干法律條例和規則及該许可居住地的物業所屬的大廈有關的公契內的條款，许可人亦不可違反屬該许可居住地的物業地段內的官批地契上的任何制約性條款。</div>
  </div>

  <div class="clause">
    <div class="clause-no">3.</div>
    <div class="clause-text">许可人除將該许可居住地的物業作其個人使用於作息用途外，不可將該许可居住地的物業或其任何部分作商業或其他用途。</div>
  </div>

  <div class="clause">
    <div class="clause-no">4.</div>
    <div class="clause-text">许可人須在#保证金支付截止日期#之前提前向A1 Plus Global Limited 支付许可保證金 #保证金# HKD（銀行轉帳，電子支付港幣）及许可人須於#第一期截止#前向A1 Plus Global Limited 支付房子租金 #第一期租金# HKD（銀行轉帳，電子支付港幣）。倘许可人於應繳總许可费用之日的2天內仍未清付該總许可费用，則A1 Plus Global Limited有權採取適當行動追討许可人所欠的總许可费用而由此而引起的一切合理的直接費用及開支將構成许可人所欠A1 Plus Global Limited的債項，A1 Plus Global Limited將有權向许可人一併追討所欠款項全數而無須退還许可人已支付押金和總许可费用。此合同為死約，如许可人提早結束许可使用期，所繳交的總许可费用或餘下的许可费用將不會退還。</div>
  </div>

  <div class="clause">
    <div class="clause-no">5.</div>
    <div class="clause-text">许可人須在许可协议期內保持许可居住地的物業內部的維修狀態良好（自然損耗及因固有的缺陷所產生的損壞除外）並須於此许可协议終止時將许可居住地的物業在同樣的維修狀態下交吉交回，否則A1 Plus Global Limited可在许可人保證金裡扣除相應的費用。在许可使用期间完结当日即#退房日期#，许可人需于中午十二点前迁出，以便安排清洁。在当日十二点后许可人遗留在许可居住地址物业的所有物件和财产，視作许可人遗弃的垃圾，A1 Plus Global Limited可以安排处置或丢掉，而不需要另行通知或赔偿许可人。如许可人遗留的垃圾过多，A1 Plus Global Limited有权向许可人收取费用或在许可保证金中扣除。</div>
  </div>

  <div class="clause">
    <div class="clause-no">6.</div>
    <div class="clause-text">许可人須交予A1 Plus Global Limited许可保證金（相等於兩個月許可費用）作為保證许可人遵守及履行此许可协议上许可人所需遵守及履行的條款的保證金。若许可人在許可時期內並無干犯此合約內任何條款，則A1 Plus Global Limited須於许可使用期間完結後及收回交吉的许可居住地的物業或收回一切许可人欠款後（以較遲者作準）21個工作天內無息退還該保證金予许可人。但若许可人拖欠根據此協議需要支付的許可費用及/或其他款項超過2天，或若许可人違反此協議內任何條款，A1 Plus Global Limited可合法收回該许可居住地的物業而此许可协议將立刻被終止；A1 Plus Global Limited可從许可保證金內扣除因许可人違約而令A1 Plus Global Limited所受的損失，而此項權利將不會影響A1 Plus Global Limited因许可人違約而可採取的其他合法行動的權利。</div>
  </div>

  <div class="clause">
    <div class="clause-no">7.</div>
    <div class="clause-text">A1 Plus Global Limited須保養及適當維修該许可居住地的物業內各主要結構部分（包括主要的排污渠、喉管和電線）。房子裡的電器，如非许可人人為損壞，維修費用由A1 Plus Global Limited負責，唯A1 Plus Global Limited須在收到许可人的書面要求或WeChat通知後才會有責任在合理時限內將有關損壞維修妥當。如遇緊急事情須修理，A1 Plus Global Limited會盡力聯絡專業維修員，而維修員會根據經驗及緊急狀況安排最適當的時間上門維修；如遇非緊急事情，則會排期處理及盡力盡快解決。如房間內的傢俬電器等能正常使用，许可人不會以東西折舊而要求A1 Plus Global Limited更換新的。</div>
  </div>

  <div class="clause">
    <div class="clause-no">8.</div>
    <div class="clause-text">许可人不得收藏違禁香港法例之物品，舉凡軍械、火藥、磺硝、汽油及揮發性之化工原料，或有爆炸性之危險品，均不許存放該樓之內外任何地方。许可人不能將該许可居住地的物業作任何非法用途。</div>
  </div>

  <div class="clause">
    <div class="clause-no">9.</div>
    <div class="clause-text">许可人須在许可协议期內自行投買風災、水、火、盜竊、意外保險，或其他保障许可人或第三者的保險等，A1 Plus Global Limited對许可人或第三者等的生命或財產等損失不負任何賠償責任。</div>
  </div>

  <div class="clause">
    <div class="clause-no">10.</div>
    <div class="clause-text">许可人容許A1 Plus Global Limited或其授權代理人在適當時間入屋檢視該物業或進行任何修理工程。A1 Plus Global Limited保留进入和管理的权利（包括但不限於为清洁、维修、检查、带潜在新用户看房等）。许可人在许可居住地的物業房间不享有独立、排他的占有权，空间可能与其他被许可人共享（如公共区域等）。</div>
  </div>

  <div class="clause">
    <div class="clause-no">11.</div>
    <div class="clause-text">如有必要，A1 Plus Global Limited可以提前1个月通知租户终止此许可协议，包括但不限于政府或其他人士征收、房屋拆除等而导致许可人无法继续使用物业的情况。如非许可人问题而A1 Plus Global Limited单方面终止此协议的（不可抗力如天灾人祸战乱等除外），A1 Plus Global Limited需要按比例退还剩余还未居住的许可费用，及在房子没有被许可人损毁和如入住当日卫生清洁状况下退回全额保证金。</div>
  </div>

  <div class="clause">
    <div class="clause-no">12.</div>
    <div class="clause-text">此合約內的英文文本與中文文本存有差異時，將以中文為準。</div>
  </div>

  <div class="clause">
    <div class="clause-no">13.</div>
    <div class="clause-text">如果对本协议有任何争议，案件将在A1 Plus Global Limited董事居住地法院解决。</div>
  </div>

  <div class="clause">
    <div class="clause-no">14.</div>
    <div class="clause-text">许可人遷出時，應搬走自己的物品。如许可人遺留的物件須由A1 Plus Global Limited代為清理，產生的相應費用A1 Plus Global Limited將在许可人的许可保證金內扣除。此协议一经签署，便会取代以往所有合同及口头承诺，以此许可协议为准。</div>
  </div>

  <div class="clause">
    <div class="clause-no">15.</div>
    <div class="clause-text">电、水、城市煤气和无线网絡，A1 Plus Global Limited會每月津貼租客港幣334元，超出用量租客需要按租住人數比例平攤水電煤網費用。多餘的津貼費用不會累積至下個月，多余的津贴也不能换成实质费用金额返还许可人。津贴方式会由租客每月根据水电煤网相关部门的账单先缴账，每三个月许可人可透过清楚公式向A1 Plus Global Limited收回津贴费用，A1 Plus Global Limited可在三十天内返还相应金额，A1 Plus Global Limited保留最终决定权。</div>
  </div>

  <div class="clause">
    <div class="clause-no">16.</div>
    <div class="clause-text">许可人不能对任何室友或邻居構成骚扰或令屋內發出異味惡臭或室內外隨處垃圾或高空擲物或昆蟲蟑螂等從屋內走出等。如许可人因個人衛生習慣導致蟑螂或昆蟲源頭在房間內產生，许可人可自行聘請專業除蟲公司處理。如以上問題一直未被许可人正視處理，導致收到室友或鄰居或香港警方或香港食環署的投诉，A1 Plus Global Limited将通过Whatsapp或微信向许可人发出警告信。如果许可人3天内没有改善，A1 Plus Global Limited有权驱逐许可人，在此情况下许可人支付的许可費用和许可保證金将不予退还。许可人如疏忽、蓄意或惡意毁壞房子需賠償，许可人需為自身的疏忽和對房子的毀壞負上法律責任。</div>
  </div>

  <div class="clause">
    <div class="clause-no">17.</div>
    <div class="clause-text">为保障许可人，A1 Plus Global Limited会替许可人打整租厘印，厘印费用为许可人承担，即许可人需在入住前与A1 Plus Global Limited再签订一份整租许可协议，即许可人为主要许可人。如许可人拒绝签订整租协议，此协议会作废及A1 Plus Global Limited有权不退还已收取的所有金额。</div>
  </div>

  <div class="clause">
    <div class="clause-no">18.</div>
    <div class="clause-text">许可人不用负担大厦管理费。</div>
  </div>

  <div class="clause">
    <div class="clause-no">19.</div>
    <div class="clause-text">许可人容许其他下届潜在许可人进入单位及其房间作参观；A1 Plus Global Limited会通过Whatsapp、SMS或Wechat提前通知租户。</div>
  </div>

  <div class="bank-info">
    <p><strong>公司帳戶</strong><br>
    銀行名稱：華僑銀行<br>
    帳戶名稱：A1 Plus Global Limited<br>
    帳戶號碼：035802826852831<br>
    SWIFT：WIHBHKHH<br>
    銀行地址：161 Queen's Road Central Hong Kong<br>
    收款人地址：Room1505, 15/F, Yu Sung Boon Building, 107-111 Des Voeux Road Central, Hong Kong</p>
  </div>

  <div class="receipt">
    <p>
      A1 Plus Global Limited 收到许可人所交的许可保證金 #保证金# HKD；<br>
      A1 Plus Global Limited 收到许可人所交的许可費用 #第一期租金# HKD；
    </p>
  </div>

  <table class="signature-table">
    <tr>
      <td>
        A1 Plus Global Limited<br>
        確認及接受這合約內所有條款的約束：
        <span class="signature-line"></span>
        Name: A1 Plus Global Limited<br>
        BR: 78053188
      </td>
      <td>
        许可人確認及接受協議內所有條款的約束：
        <span class="signature-line"></span>
        Name: #姓名#<br>
        Passport / China ID: #证件号码#
      </td>
    </tr>
  </table>
</div>
`;
  }

  function getPDFStyle() {
    return `
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 12mm 14mm 12mm;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #000000 !important;
    overflow: visible !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family:
      Arial,
      "PingFang HK",
      "PingFang TC",
      "PingFang SC",
      "Microsoft JhengHei",
      "Microsoft YaHei",
      "Noto Sans CJK TC",
      "Noto Sans CJK SC",
      sans-serif;
    font-size: 10.5pt;
    line-height: 1.55;
  }

  body::before,
  body::after,
  .contract::before,
  .contract::after {
    display: none !important;
    content: none !important;
    border: none !important;
  }

  .contract {
    width: 100%;
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #000000;
    overflow: visible;
    border: none !important;
    box-shadow: none !important;
    outline: none !important;
  }

  h1 {
    margin: 0 0 7mm 0;
    padding: 0;
    text-align: center;
    font-size: 18pt;
    line-height: 1.25;
    font-weight: 700;
    page-break-after: avoid;
    break-after: avoid;
  }

  p {
    margin: 0 0 3.4mm 0;
    padding: 0;
  }

  .meta {
    margin: 5mm 0 6mm 0;
  }

  .meta-row {
    display: table;
    width: 100%;
    margin: 0 0 2.2mm 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .meta-label {
    display: table-cell;
    width: 36mm;
    font-weight: 700;
    white-space: nowrap;
    vertical-align: top;
  }

  .meta-value {
    display: table-cell;
    vertical-align: top;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  .intro {
    margin-bottom: 4.2mm;
    font-weight: 700;
    page-break-after: avoid;
    break-after: avoid;
  }

  .clause {
    display: block;
    margin: 0 0 3mm 0;
    padding: 0;
    page-break-inside: auto;
    break-inside: auto;
    orphans: 2;
    widows: 2;
  }

  .clause::after {
    content: "";
    display: block;
    clear: both;
  }

  .clause-no {
    float: left;
    width: 8mm;
    font-weight: 700;
  }

  .clause-text {
    margin-left: 9.5mm;
    text-align: justify;
    text-justify: inter-ideograph;
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  .bank-info {
    margin: 6mm 0 5mm 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .receipt {
    margin: 4mm 0 7mm 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .signature-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    margin-top: 8mm;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .signature-table td {
    width: 50%;
    vertical-align: top;
    padding: 0 7mm 0 0;
    font-size: 10.5pt;
    line-height: 1.55;
    border: none !important;
  }

  .signature-table td + td {
    padding: 0 0 0 7mm;
  }

  .signature-line {
    display: block;
    margin-top: 16mm;
    margin-bottom: 3mm;
    border-bottom: 1px solid #000;
    height: 0;
    width: 70mm;
  }

  @media print {
    html,
    body {
      width: auto !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      overflow: visible !important;
    }

    body::before,
    body::after,
    .contract::before,
    .contract::after {
      display: none !important;
      content: none !important;
      border: none !important;
    }

    .contract {
      border: none !important;
      box-shadow: none !important;
      outline: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    h1,
    .intro,
    .meta-row,
    .bank-info,
    .receipt,
    .signature-table {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }
</style>
`;
  }

  function buildContractHTML() {
    if (!validateBeforeGenerate()) {
      return null;
    }

    const data = collectFormData();
    const contract = renderTemplate(getContractTemplate(), data);

    return `
<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>许可协议</title>
${getPDFStyle()}
</head>
<body>
${contract}
</body>
</html>
`;
  }

  function openPrintWindow(html) {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("浏览器阻止了弹出窗口，请允许弹出窗口后再点击下载 PDF。");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    const triggerPrint = function () {
      setTimeout(function () {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };

    if (printWindow.document.readyState === "complete") {
      triggerPrint();
    } else {
      printWindow.onload = triggerPrint;
    }
  }

  function downloadPDF() {
    try {
      const html = buildContractHTML();

      if (!html) {
        return;
      }

      openPrintWindow(html);
    } catch (err) {
      console.error(err);
      alert("下载 PDF 失败：" + err.message);
    }
  }

  window.parseInput = parseInput;
  window.calculate = calculate;
  window.downloadPDF = downloadPDF;
})();
