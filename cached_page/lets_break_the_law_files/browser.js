
function chkBrowser() {
    if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // not mobile
        return false;
    } else {
    // is mobile
    return true;
    }
}