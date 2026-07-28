import React from "react";

const useTelegram = () => {
  const [tg, setTg] = React.useState(null);

  React.useEffect(() => {
    const telegram = window?.Telegram?.WebApp;
    setTg(telegram);
    tg?.ready();
    tg?.expand();
  }, [tg]);

  const onClose = React.useCallback(() => {
    tg.close();
  }, [tg]);

  return {
    tg,
    onClose,
    user: tg?.initDataUnsage?.user,
  };
};

export default useTelegram;
