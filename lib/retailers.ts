export interface RetailerConfig {
  id: string
  name: string
  domain: string
  logo: string
  shippingThreshold: number | null
  shippingFree: string
  newUserOffer: string | null
  newUserSignupUrl: string | null
  shippingUrl: string
  promoUrl: string
}

export const RETAILERS: RetailerConfig[] = [
  {
    id: 'zara',
    name: 'Zara',
    domain: 'zara.com',
    logo: '🟢',
    shippingThreshold: 50,
    shippingFree: 'Free shipping on orders over €50',
    newUserOffer: null,
    newUserSignupUrl: null,
    shippingUrl: 'https://www.zara.com/es/en/z-shipping-policies-cat442.html',
    promoUrl: 'https://www.zara.com/es/',
  },
  {
    id: 'mango',
    name: 'Mango',
    domain: 'mango.com',
    logo: '🟠',
    shippingThreshold: 50,
    shippingFree: 'Free shipping on orders over €50',
    newUserOffer: '10% off your first order when you sign up',
    newUserSignupUrl: 'https://shop.mango.com/es/newsletter',
    shippingUrl: 'https://shop.mango.com/es/ayuda/envios',
    promoUrl: 'https://shop.mango.com/es',
  },
  {
    id: 'zalando',
    name: 'Zalando',
    domain: 'zalando.es',
    logo: '🟡',
    shippingThreshold: 24.90,
    shippingFree: 'Free shipping on orders over €24.90. Always free returns.',
    newUserOffer: 'New customers: check for welcome offer at signup',
    newUserSignupUrl: 'https://www.zalando.es/registro/',
    shippingUrl: 'https://www.zalando.es/ayuda/envios/',
    promoUrl: 'https://www.zalando.es',
  },
  {
    id: 'pullandbear',
    name: 'Pull&Bear',
    domain: 'pullandbear.com',
    logo: '🔵',
    shippingThreshold: 40,
    shippingFree: 'Free shipping on orders over €40',
    newUserOffer: '10% off first order with newsletter signup',
    newUserSignupUrl: 'https://www.pullandbear.com/es/newsletter',
    shippingUrl: 'https://www.pullandbear.com/es/envios',
    promoUrl: 'https://www.pullandbear.com/es',
  },
  {
    id: 'bershka',
    name: 'Bershka',
    domain: 'bershka.com',
    logo: '🟣',
    shippingThreshold: 40,
    shippingFree: 'Free shipping on orders over €40',
    newUserOffer: '10% off first order with newsletter signup',
    newUserSignupUrl: 'https://www.bershka.com/es/newsletter',
    shippingUrl: 'https://www.bershka.com/es/envios',
    promoUrl: 'https://www.bershka.com/es',
  },
  {
    id: 'hm',
    name: 'H&M',
    domain: 'hm.com',
    logo: '🔴',
    shippingThreshold: 40,
    shippingFree: 'Free shipping on orders over €40',
    newUserOffer: 'Join H&M Member for exclusive discounts',
    newUserSignupUrl: 'https://www2.hm.com/es_es/member/register.html',
    shippingUrl: 'https://www2.hm.com/es_es/servicio-de-atencion-al-cliente/informacion-sobre-pedidos/envios.html',
    promoUrl: 'https://www2.hm.com/es_es',
  },
  {
    id: 'womenssecret',
    name: "Women'Secret",
    domain: 'womenssecret.com',
    logo: '🩷',
    shippingThreshold: 40,
    shippingFree: 'Free shipping on orders over €40',
    newUserOffer: '15% off first order with newsletter signup',
    newUserSignupUrl: 'https://www.womenssecret.com/es/newsletter',
    shippingUrl: 'https://www.womenssecret.com/es/envios',
    promoUrl: 'https://www.womenssecret.com/es',
  },
  {
    id: 'sprinter',
    name: 'Sprinter',
    domain: 'sprinter.es',
    logo: '⚡',
    shippingThreshold: 59,
    shippingFree: 'Free shipping on orders over €59',
    newUserOffer: '10% off first order with newsletter signup',
    newUserSignupUrl: 'https://www.sprinter.es/newsletter',
    shippingUrl: 'https://www.sprinter.es/atencion-al-cliente/envios',
    promoUrl: 'https://www.sprinter.es',
  },
  {
    id: 'cortefiel',
    name: 'Cortefiel',
    domain: 'cortefiel.com',
    logo: '🏅',
    shippingThreshold: 60,
    shippingFree: 'Free shipping on orders over €60',
    newUserOffer: '10% off first order when you join Club Cortefiel',
    newUserSignupUrl: 'https://www.cortefiel.com/es/club',
    shippingUrl: 'https://www.cortefiel.com/es/envios',
    promoUrl: 'https://www.cortefiel.com/es',
  },
]

export function getRetailerByDomain(url: string): RetailerConfig | null {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    return RETAILERS.find(r => hostname.includes(r.domain.replace('www.', ''))) || null
  } catch {
    return null
  }
}
