/**
 * Get the standardized logo source for a brand based on its slug or logo_url
 */
export const getBrandLogo = (brand) => {
    const slug = brand?.brand_slug?.toLowerCase();
    let logoSrc = brand?.logo_url;

    if (slug === 'chumbak') logoSrc = '/chumbaklogo.png';
    else if (slug === 'pet-crux' || slug === 'petcrux') logoSrc = '/petcruxlogo.jpg';
    else if (slug === 'pepe') logoSrc = '/pepelogo.png';
    else if (slug === 'goat') logoSrc = '/goatlogo.png';
    else if (slug === 'happilo') logoSrc = '/happilo_logo.jpg';

    if (!logoSrc || logoSrc === '') logoSrc = '/trabenfull.png';
    return logoSrc;
};
