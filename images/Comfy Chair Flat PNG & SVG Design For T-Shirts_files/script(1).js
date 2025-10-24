(async function () {
  // Constantes para mejorar mantenibilidad
  const COOKIE_PREFIX = 'vx.';
  const API_BASE_URL = 'https://api.vexels.com/v1';
  const BANNER_COOKIE_EXPIRY = 31536000; // 1 año en segundos
  const ONE_MONTH_DAYS = 30;
  const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
  const BANNER_DELAY_MS = 100;
  const BANNER_ANIMATION_DELAY = 100;

  // Utilidades para cookies con mejor manejo de errores
  function hasCookie(name) {
    try {
      return document.cookie.includes(`${name}`);
    } catch (error) {
      console.error('Error checking cookie:', error);
      return false;
    }
  }

  function getCookie(name) {
    try {
      const parts = document.cookie.split(`${name}=`);
      if (parts.length === 2) {
        return parts[1].split(";")[0];
      }
      return null;
    } catch (error) {
      console.error('Error getting cookie:', error);
      return null;
    }
  }

  function setCookie(name, value, options = {}) {
    try {
      const defaultOptions = {
        path: '/',
        secure: window.location.protocol === 'https:',
        samesite: 'lax',
        ...options
      };
      
      const cookieString = Object.entries(defaultOptions)
        .map(([key, val]) => `${key}=${val}`)
        .join('; ');
      
      document.cookie = `${name}=${value}; ${cookieString}`;
    } catch (error) {
      console.error('Error setting cookie:', error);
    }
  }

  // Mejorar manejo de fechas con validación
  function getUserHasPaidForOneMonth(purchaseDate) {
    try {
      if (!purchaseDate) {
        console.warn('No purchase date provided');
        return false;
      }

      const userPurchaseDate = new Date(purchaseDate);
      
      // Validar que la fecha sea válida
      if (isNaN(userPurchaseDate.getTime())) {
        console.error('Invalid purchase date:', purchaseDate);
        return false;
      }

      const oneMonthInMs = ONE_MONTH_DAYS * MILLISECONDS_PER_DAY;
      const purchaseTime = userPurchaseDate.getTime();
      const currentTime = new Date().getTime();
      
      return currentTime - purchaseTime >= oneMonthInMs;
    } catch (error) {
      console.error('Error calculating payment duration:', error);
      return false;
    }
  }

  // Mejorar lógica de usuario pagado con validación
  async function getUserIsPaid(userData) {
    try {
      if (window.isPaidUser === true) {
        return true;
      } else if (window.isPaidUser === false) {
        return false;
      }

      if (!userData || typeof userData !== 'object') {
        console.warn('Invalid user data provided');
        return false;
      }

      const isPaidUser = userData.idPlan !== 1 && !userData.isFreeTrialSubscriptor;
      window.isPaidUser = isPaidUser;
      return isPaidUser;
    } catch (error) {
      console.error('Error determining paid user status:', error);
      return false;
    }
  }

  // Mejorar obtención de datos de usuario con validación completa
  async function getUserData() {
    try {
      const strategy = getCookie("vx.strategy");
      if (!strategy) {
        throw new Error('No authentication strategy found');
      }

      const token = getCookie(`vx.token.${strategy}`);
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const userData = await response.json();
      
      // Validar estructura básica de userData
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data structure');
      }

      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  // Funciones auxiliares para evaluar usuario
  function shouldShowBannerForLoginStatus(settings, isLoggedIn) {
    const { logIn } = settings.user;
    
    if (logIn === "must" && !isLoggedIn) return false;
    if (logIn === "mustNot" && isLoggedIn) return false;
    
    return true;
  }

  function shouldShowBannerForPaidStatus(settings, isPaidUser) {
    const { paidUser } = settings.user;
    
    if (paidUser === "must" && !isPaidUser) return false;
    if (paidUser === "mustNot" && isPaidUser) return false;
    
    return true;
  }

  function shouldShowBannerForPaymentDuration(settings, userData) {
    if (!settings.user.requirePaidUserForOneMonth) {
      return true;
    }

    const hasBeenPaidForOneMonth = getUserHasPaidForOneMonth(
      userData.datePlanPurchase
    );
    
    return hasBeenPaidForOneMonth;
  }

  // Función principal refactorizada con mejor manejo de errores
  async function evaluateUser(settings) {
    try {
      // Validar configuración
      if (!settings || !settings.user) {
        console.warn('Invalid settings provided to evaluateUser');
        return false;
      }

      // Si ambos son opcionales, mostrar banner
      if (
        settings.user.logIn === "optional" &&
        settings.user.paidUser === "optional"
      ) {
        return true;
      }

      const isLoggedIn = hasCookie("vx.strategy");
      
      // Evaluar estado de login
      if (!shouldShowBannerForLoginStatus(settings, isLoggedIn)) {
        return false;
      }

      // Si no necesita evaluación de usuario pagado, continuar
      if (settings.user.paidUser === "optional") {
        return true;
      }

      // Si necesita evaluación de usuario pagado pero no está logueado
      if ((settings.user.paidUser === "must" || settings.user.paidUser === "mustNot") && !isLoggedIn) {
        return false;
      }

      // Obtener datos del usuario solo si es necesario
      let userData = null;
      let isPaidUser = false;

      if (settings.user.paidUser === "must" || settings.user.paidUser === "mustNot") {
        try {
          userData = await getUserData();
          isPaidUser = await getUserIsPaid(userData);
        } catch (error) {
          console.error('Error getting user data for paid status evaluation:', error);
          return false;
        }
      }

      // Evaluar estado de pago
      if (!shouldShowBannerForPaidStatus(settings, isPaidUser)) {
        return false;
      }

      // Evaluar duración de pago si es necesario
      if (userData && !shouldShowBannerForPaymentDuration(settings, userData)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in evaluateUser:', error);
      return false;
    }
  }

  // Función auxiliar para validar y crear RegExp de forma segura
  function createSafeRegExp(pattern) {
    try {
      return new RegExp(pattern);
    } catch (error) {
      console.error('Invalid regex pattern:', pattern, error);
      return null;
    }
  }

  // Función auxiliar para evaluar URLs con validación
  function evaluateUrlPatterns(patterns, actualUrl) {
    return patterns.some((pattern) => {
      const regex = createSafeRegExp(pattern);
      if (!regex) return false;
      
      try {
        return regex.test(actualUrl);
      } catch (error) {
        console.error('Error testing regex pattern:', pattern, error);
        return false;
      }
    });
  }

  function evaluateUrl(settings) {
    try {
      // Validar configuración
      if (!settings || !settings.url) {
        console.warn('Invalid URL settings provided');
        return false;
      }

      const actualUrl = window.location.href;
      
      if (settings.url.default === "hide") {
        if (!settings.url.showInUrlsThatIncludes || !Array.isArray(settings.url.showInUrlsThatIncludes)) {
          console.warn('Invalid showInUrlsThatIncludes configuration');
          return false;
        }
        
        return evaluateUrlPatterns(settings.url.showInUrlsThatIncludes, actualUrl);
      }
      
      if (settings.url.default === "show") {
        if (!settings.url.hideInUrlsThatIncludes || !Array.isArray(settings.url.hideInUrlsThatIncludes)) {
          console.warn('Invalid hideInUrlsThatIncludes configuration');
          return true; // Si no hay patrones para ocultar, mostrar por defecto
        }
        
        const shouldHide = evaluateUrlPatterns(settings.url.hideInUrlsThatIncludes, actualUrl);
        return !shouldHide;
      }
      
      return false;
    } catch (error) {
      console.error('Error in evaluateUrl:', error);
      return false;
    }
  }

  function evaluateCloseBehavior(banner) {
    try {
      if (!banner || !banner.settings) {
        console.warn('Invalid banner configuration for close behavior');
        return false;
      }

      if (banner.settings.closeBehavior === "showEveryVisit") {
        return true;
      }

      const isHidden = document.cookie.includes(
        `vx.banner.${banner.id}.hidden=true`
      );
      return !isHidden;
    } catch (error) {
      console.error('Error evaluating close behavior:', error);
      return false;
    }
  }

  async function evaluateBanner(banner) {
    try {
      if (!banner) {
        console.warn('No banner provided for evaluation');
        return false;
      }

      if (!evaluateCloseBehavior(banner)) {
        return false;
      }

      if (!evaluateUrl(banner.settings)) {
        return false;
      }

      if (!(await evaluateUser(banner.settings))) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error evaluating banner:', error);
      return false;
    }
  }

  function getShowVariation(settings) {
    try {
      if (!settings || !settings.variants || !Array.isArray(settings.variants)) {
        console.warn('Invalid settings for variation selection');
        return null;
      }

      if (settings.variants.length === 0) {
        console.warn('No variants available');
        return null;
      }

      const cookieVariation = getCookie(`vx.banner.${settings.id}.variation`);
      
      if (cookieVariation) {
        const shownVariation = settings.variants.find(
          (variant) => variant.id === cookieVariation
        );
        
        if (shownVariation) {
          return shownVariation;
        } else {
          console.warn('Cookie variation not found in available variants, selecting new one');
        }
      }

      // Seleccionar variación aleatoria
      const randomIndex = Math.floor(Math.random() * settings.variants.length);
      const randomVariation = settings.variants[randomIndex];
      
      if (randomVariation) {
        setCookie(`vx.banner.${settings.id}.variation`, randomVariation.id, {
          'max-age': BANNER_COOKIE_EXPIRY
        });
      }
      
      return randomVariation;
    } catch (error) {
      console.error('Error getting show variation:', error);
      return null;
    }
  }

  // Función para crear y mostrar el banner
  function createBannerElement(bannerContentText, bannerData) {
    const bannerDom = document.createElement("div");
    bannerDom.innerHTML = bannerContentText;
    document.body.appendChild(bannerDom);

    // Agregar animación después de un pequeño delay
    setTimeout(() => {
      bannerDom.classList.add("sticky-bar-enter");
    }, BANNER_ANIMATION_DELAY);

    // Manejar clics para cerrar banner
    bannerDom.addEventListener("click", (event) => {
      if (
        event.target &&
        (event.target.matches(".close-button") ||
          event.target.matches(".web-banner-element"))
      ) {
        setCookie(`vx.banner.${bannerData.id}.hidden`, 'true', {
          'max-age': BANNER_COOKIE_EXPIRY
        });
        bannerDom.remove();
      }
    });
  }

  // Función para mostrar banner con delay
  function displayBanner(bannerContentText, bannerData) {
    const delayMs = (bannerData.settings.delaySeconds || 0) * 1000;
    
    if (delayMs > 0) {
      setTimeout(() => {
        createBannerElement(bannerContentText, bannerData);
      }, delayMs);
    } else {
      createBannerElement(bannerContentText, bannerData);
    }
  }

  // Función principal para procesar banners
  async function processBanners() {
    try {
      const url = "/astro-static/web-banners/banners.json";
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch banners: ${response.status} ${response.statusText}`);
      }
      
      const banners = await response.json();
      
      if (!banners || !banners.banners || !Array.isArray(banners.banners)) {
        console.warn('Invalid banners data structure');
        return;
      }

      for (const bannerData of banners.banners) {
        try {
          // Evaluar si debe mostrar el banner
          const shouldShowBanner = await evaluateBanner(bannerData);
          if (!shouldShowBanner) {
            continue;
          }

          // Obtener variación a mostrar
          const selectedVariation = getShowVariation(bannerData);
          if (!selectedVariation || !selectedVariation.url) {
            console.warn('No valid variation found for banner:', bannerData.id);
            continue;
          }

          // Obtener contenido del banner
          const bannerContentResponse = await fetch(selectedVariation.url);
          if (!bannerContentResponse.ok) {
            console.warn(`Failed to fetch banner content: ${bannerContentResponse.status}`);
            continue;
          }

          const bannerContentText = await bannerContentResponse.text();
          if (!bannerContentText) {
            console.warn('Empty banner content');
            continue;
          }

          // Mostrar el banner
          displayBanner(bannerContentText, bannerData);
          
        } catch (error) {
          console.error(`Error processing banner ${bannerData.id}:`, error);
          // Continuar con el siguiente banner en caso de error
        }
      }
    } catch (error) {
      console.error('Error in banner processing:', error);
    }
  }

  // Ejecutar procesamiento de banners
  await processBanners();
})();
