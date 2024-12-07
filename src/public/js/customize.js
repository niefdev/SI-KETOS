function notifier(mode, text) {
  new Notify({
    status: mode,
    title: mode == "success" ? "Berhasil" : "Peringatan",
    text: text,
    effect: "fade",
    speed: 300,
    showIcon: true,
    showCloseButton: true,
    autoclose: true,
    autotimeout: 3000,
    type: "outline",
    position: "right top",
  });
}

function formatDescription(data) {
  let htmlOutput = "";
  let inList = false;

  data.split("\n").forEach((line) => {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("-")) {
      if (!inList) {
        htmlOutput += "<ul class='list-outside list-disc space-y-1 ps-5'>\n";
        inList = true;
      }
      htmlOutput += `<li>${trimmedLine.replace("- ", "")}</li>\n`;
    } else {
      if (inList) {
        htmlOutput += "</ul>\n";
        inList = false;
      }
      if (trimmedLine) {
        htmlOutput += `${trimmedLine}\n`;
      }
    }
  });

  if (inList) {
    htmlOutput += "</ul>\n";
  }

  return htmlOutput;
}
