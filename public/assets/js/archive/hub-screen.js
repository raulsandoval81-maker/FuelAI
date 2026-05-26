const HUB_SCREEN_CONFIG = {

  standard: {
    maxWidth: "520px",
    hotspotLeft: "13%",
    hotspotWidth: "74%",
    hotspotHeight: "7%"
  },

  rows4: {
    one: "55%",
    two: "64%",
    three: "73%",
    four: "82%"
  }

};

document.querySelectorAll(".hub-screen")
  .forEach(screen => {

    screen.style.maxWidth =
      HUB_SCREEN_CONFIG.standard.maxWidth;

  });

document.querySelectorAll(".hub-hotspot")
  .forEach(spot => {

    spot.style.left =
      HUB_SCREEN_CONFIG.standard.hotspotLeft;

    spot.style.width =
      HUB_SCREEN_CONFIG.standard.hotspotWidth;

    spot.style.height =
      HUB_SCREEN_CONFIG.standard.hotspotHeight;

  });

document.querySelectorAll(".hub-hotspot.one")
  .forEach(el => {
    el.style.top =
      HUB_SCREEN_CONFIG.rows4.one;
  });

document.querySelectorAll(".hub-hotspot.two")
  .forEach(el => {
    el.style.top =
      HUB_SCREEN_CONFIG.rows4.two;
  });

document.querySelectorAll(".hub-hotspot.three")
  .forEach(el => {
    el.style.top =
      HUB_SCREEN_CONFIG.rows4.three;
  });

document.querySelectorAll(".hub-hotspot.four")
  .forEach(el => {
    el.style.top =
      HUB_SCREEN_CONFIG.rows4.four;
  });