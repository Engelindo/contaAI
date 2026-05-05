export function messageNoCards(): string {
  return (
    "Você ainda não tem cartões cadastrados. " +
    "Cadastre um cartão (ex.: \"cadastra cartão Nubank limite 5000\") " +
    "ou diga na despesa qual cartão usar (ex.: \"Uber 30 no Nubank\")."
  );
}

export function messageCardRequired(cardNames: string[]): string {
  const list = cardNames.join(", ");
  return (
    "Você tem mais de um cartão cadastrado. " +
    `Diga qual cartão usar na mensagem (ex.: \"Uber 30 no Nubank\"). Cartões: ${list}.`
  );
}
