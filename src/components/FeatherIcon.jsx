import feather from 'feather-icons';

/**
 * React-safe Feather Icon component
 * Uses dangerouslySetInnerHTML to render SVG without conflicting with React's virtual DOM
 */
export default function FeatherIcon({ name, className = '', size = 24 }) {
    const icon = feather.icons[name];

    if (!icon) {
        console.warn(`FeatherIcon: Icon "${name}" not found`);
        return null;
    }

    const svgString = icon.toSvg({
        class: className,
        width: size,
        height: size,
    });

    return (
        <span
            className="inline-flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: svgString }}
        />
    );
}
