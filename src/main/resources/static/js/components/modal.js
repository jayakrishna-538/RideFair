const Modal = {
    show(title, contentHTML, onSubmit, options = {}) {
        const { hideSubmit = false, submitLabel = 'Save', cancelLabel = 'Close' } = options;
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <h2>${title}</h2>
                <div class="modal-body">${contentHTML}</div>
                <div class="modal-actions" style="justify-content:center;">
                    <button class="btn btn-secondary" id="modal-cancel">${hideSubmit ? cancelLabel : 'Cancel'}</button>
                    ${hideSubmit ? '' : `<button class="btn btn-primary" id="modal-submit">${submitLabel}</button>`}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('visible'));

        overlay.querySelector('#modal-cancel').onclick = () => this.close(overlay);
        const submitBtn = overlay.querySelector('#modal-submit');
        if (submitBtn) {
            submitBtn.onclick = () => { if (onSubmit) onSubmit(overlay); };
        }
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close(overlay);
        });

        return overlay;
    },

    close(overlay) {
        if (!overlay) return;
        overlay.classList.remove('visible');
        setTimeout(() => overlay.remove(), 200);
    }
};
