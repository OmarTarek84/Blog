if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./custom-sw-import.js', {scope: '.'}).then(() => {
        console.log('sw works');
    });
}