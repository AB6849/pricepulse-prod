import HomeDesktop from "./HomeDesktop";
import HomeMobile from "./HomeMobile";
import useBreakpoint from "../../hooks/useBreakpoint";

export default function Home() {
    const { isMobile } = useBreakpoint();

    return isMobile ? <HomeMobile /> : <HomeDesktop />;
}