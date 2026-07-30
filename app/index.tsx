import { Redirect } from "expo-router";
import { useSettings } from "../context/SettingsContext";

export default function Index() {
  const { hasOnboarded } = useSettings();
  return <Redirect href={hasOnboarded ? "/(tabs)" : "/onboarding"} />;
}
