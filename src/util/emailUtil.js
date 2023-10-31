const generateRoundUp = (data) => {
  const events = data.arr
    .filter(item => item.events?.length)
    .map(item => item.events
      .filter(event => event.length)
      .map(event => `<li>${event}</li>`)
      .join('\n'))
    .join('\n');
  const wls = data.arr
    .filter(item => item.wishlists?.length)
    .map(item => item.wishlists
      .filter(wl => wl.length)
      .map(wl => `<li>${wl}</li>`)
      .join('\n'))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <title>Weekly Round-Up</title>
</head>
<body>
<img width="420" height="140" src="${process.env.IMAGES_URL}/logo.svg" alt="logo">
<p>Hi, ${data.user.name}</p>
<p>Here's a few things that happened in your circle this week & what's coming up:</p>
<ul>
    ${events.length ? events : ''}
    ${wls.length ? wls : ''}
</ul>
<p>Enjoy the rest of your week!</p>
<p/>
<p>Muse team</p>
</body>
</html>
`;
};

module.exports = {
  generateRoundUp,
};
