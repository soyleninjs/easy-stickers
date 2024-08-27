const nameCustomElement = "toast-notifications";
class ToastNotificactions extends window.HTMLElement {
  connectedCallback() {
    this.delayToHide = 1000
  }

  htmlStringToNode(htmlString) {
    return new window.DOMParser().parseFromString(htmlString, "text/html").body.firstElementChild;
  };

  createToast(message, status = "default") {
    const toastString = `
      <div class="toast">
        ${message}
      </div> q
    `;
  
    const toast = this.htmlStringToNode(toastString)
    toast.style.setProperty("--delay-to-hide", `${this.delayToHide / 1000}s`)
    toast.classList.add(status)
    this.append(toast);
    window.setTimeout(() => this.removeToast(toast), this.delayToHide);
  };

  removeToast(toast) {
    toast.classList.add("hide");
    window.setTimeout(() => toast.remove(), 500);
  }
}

if (!window.customElements.get(nameCustomElement)) {
  window.customElements.define(nameCustomElement, ToastNotificactions);
}
