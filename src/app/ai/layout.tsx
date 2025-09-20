import { useEnforceAuth } from "../useEnforceAuth";

export default async function AiLayout(props: { children: React.ReactNode }) {
  const { children } = props;
  await useEnforceAuth();
  return <>{children}</>;
}
