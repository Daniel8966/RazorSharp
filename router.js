export async function loadView(view) {

    const html = await window.electronAPI.loadHTML(
        `views/${view}/${view}.html`
    );

    document.getElementById("main-content").innerHTML = html;

}