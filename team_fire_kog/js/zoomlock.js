// Browser zoom, turned off.
//
// The page already has a zoom -- tap a tile and that angle fills the screen,
// with arrows and a way out drawn where a thumb can reach them. A browser zoom
// on top of that is a second, invisible transform: the controls it needs are
// laid out against the visual viewport, so pinching scrolls them off the edge
// and leaves someone holding a magnified corner of the mosaic with nothing on
// screen that offers a way back. Two people did exactly that on first contact.
//
// No single switch does this, so all four of the mechanisms browsers use to
// start a zoom are closed:
//
//   - <meta viewport> user-scalable=no, maximum-scale=1
//       Honoured by Chrome and by Android. iOS Safari has deliberately ignored
//       it since iOS 10, which is why the rest of this exists.
//   - touch-action: pan-x pan-y  (in wall.css)
//       Excludes pinch-zoom and double-tap-to-zoom from the allowed gestures
//       while leaving one-finger panning alone, so the credit roll still
//       scrolls. Understood by iOS Safari 13+.
//   - gesturestart / gesturechange / gestureend
//       WebKit's own pinch events, on both iOS and macOS Safari. This is the
//       one that actually stops a trackpad pinch on a Mac.
//   - wheel with ctrlKey
//       How Chrome and Firefox report a trackpad pinch, and how ctrl+scroll
//       arrives. Blink only honours preventDefault on a non-passive listener,
//       hence passive: false on all of these.
//
// Deliberately still allowed: cmd/ctrl and +/-/0, and the browser's own zoom
// menu. Those are someone asking for the page to be bigger in as many words,
// not a gesture they landed on by accident, and there is no way to intercept
// them that does not also break the browser's accessibility settings.
export function lockZoom(target = document) {
  const swallow = (event) => { event.preventDefault(); };

  for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
    target.addEventListener(type, swallow, { passive: false });
  }

  target.addEventListener("wheel", (event) => {
    if (event.ctrlKey) event.preventDefault();
  }, { passive: false });

  // Belt and braces for iOS: a two-finger drag that touch-action did not catch
  // can still pan a zoomed viewport. One finger is left untouched -- that is a
  // scroll in the credit roll, or a swipe between angles.
  target.addEventListener("touchmove", (event) => {
    if (event.touches.length > 1) event.preventDefault();
  }, { passive: false });
}
