export const emailConfirmationEmail = (link) => {
    return `<html
    lang="en"
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:o="urn:schemas-microsoft-com:office:office"
  >
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link
        href="https://fonts.googleapis.com/css?family=Lekton:regular,italic,700"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css?family=Alata:regular"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css?family=Sunflower:300,500,700"
        rel="stylesheet"
      />
      <style type="text/css" data-hse-inline-css="true">
        .button_class:hover {
          color: #5cc3d3 !important;
          background: linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.1),
              rgba(0, 0, 0, 0.1)
            ),
            linear-gradient(92.69deg, #075cdc 0.97%, #a900b8 97.83%) !important;
          box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.25),
            inset 0px 10px 10px rgba(0, 0, 0, 0.25) !important;
        }
        .button_class:active {
          background: linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.1),
              rgba(0, 0, 0, 0.1)
            ),
            linear-gradient(92.69deg, #075cdc 0.97%, #a900b8 97.83%) !important;
          box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.25),
            inset 0px 10px 10px rgba(0, 0, 0, 0.4) !important;
        }
      </style>
    </head>
    <body
      style="
        background-color: white;
        color: #ffffff !important;
        font-family: 'Lekton', sans-serif;
      "
    >
    <div
    style="
      max-width: 1000px;
      margin: 0 auto;
      text-align: center;
      width: 100%;
      background-color: #030a31;
      position: relative;
    "
  >
   
  
      <img
      src="https://i.ibb.co/s5pzRx9/logo.png"
      alt="header"
      draggable="false"
    />
    <div style="margin-top: 30px;">
      <div>
            <p
              style="
                color: #5cc3d3;
                font-size: 55px;
                font-family: 'Sunflower';
                line-height: 0;
              "
            >
              We need to verify your account
            </p>
  
            <p style="font-size: 20px; text-align: center">
              Welcome to Lucy's Game<br />
              Click on the button below to verify your email.
            </p>
            <a 
              href="${link}"
              target="_blank"
              referrerpolicy="no-referrer">
            <button
              style="
                background: linear-gradient(
                    0deg,
                    rgba(0, 0, 0, 0.1),
                    rgba(0, 0, 0, 0.1)
                  ),
                  linear-gradient(92.69deg, #075cdc 0.97%, #a900b8 97.83%);
                box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.25);
                border-radius: 82.6667px;
                transition: all 0.3s;
                font-size: 20px;
                padding: 20px;
                cursor: pointer;
                color: #ffffff;
                font-family: Lekton;
                font-weight: 700;
                width: 375px;
                margin-top: 40px;
              "
              class="button_class"
            >
              Confirm email
            </button>
            </a>
          </div>
          <div style=" padding: 50px 0; ">
            <div style="background: white; height: 1px;"></div>
            <p style="color: #bababa; font-size: 15px">
              @2022&nbsp;Copyright Lucy
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}
export const resetPasswordEmail = (link) => {
    return `<html
    lang="en"
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:o="urn:schemas-microsoft-com:office:office"
  >
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link
        href="https://fonts.googleapis.com/css?family=Lekton:regular,italic,700"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css?family=Alata:regular"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css?family=Sunflower:300,500,700"
        rel="stylesheet"
      />
      <style type="text/css" data-hse-inline-css="true">
        .button_class:hover {
          color: #5cc3d3 !important;
          background: linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.1),
              rgba(0, 0, 0, 0.1)
            ),
            linear-gradient(92.69deg, #075cdc 0.97%, #a900b8 97.83%) !important;
          box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.25),
            inset 0px 10px 10px rgba(0, 0, 0, 0.25) !important;
        }
        .button_class:active {
          background: linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.1),
              rgba(0, 0, 0, 0.1)
            ),
            linear-gradient(92.69deg, #075cdc 0.97%, #a900b8 97.83%) !important;
          box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.25),
            inset 0px 10px 10px rgba(0, 0, 0, 0.4) !important;
        }
      </style>
    </head>
    <body
      style="
        background-color: white;
        color: #ffffff !important;
        font-family: 'Lekton', sans-serif;
      "
    >
    <div
    style="
      max-width: 1000px;
      margin: 0 auto;
      text-align: center;
      width: 100%;
      background-color: #030a31;
      position: relative;
    "
  >
   
  
      <img
      src="https://i.ibb.co/s5pzRx9/logo.png"
      alt="header"
      draggable="false"
    />
    <div style="margin-top: 30px;">
      <div>
            <p
              style="
                color: #5cc3d3;
                font-size: 55px;
                font-family: 'Sunflower';
                line-height: 0;
              "
            >
              We need to change your password
            </p>
  
            <p style="font-size: 20px; text-align: center">
              Welcome to Lucy's Game<br />
              Click on the button below to reset your password.
            </p>
            <a 
              href="${link}"
              target="_blank"
              referrerpolicy="no-referrer">
            <button
              style="
                background: linear-gradient(
                    0deg,
                    rgba(0, 0, 0, 0.1),
                    rgba(0, 0, 0, 0.1)
                  ),
                  linear-gradient(92.69deg, #075cdc 0.97%, #a900b8 97.83%);
                box-shadow: 0px 5px 5px rgba(0, 0, 0, 0.25);
                border-radius: 82.6667px;
                transition: all 0.3s;
                font-size: 20px;
                padding: 20px;
                cursor: pointer;
                color: #ffffff;
                font-family: Lekton;
                font-weight: 700;
                width: 375px;
                margin-top: 40px;
              "
              class="button_class"
            >
              Reset Password 
            </button>
            </a>
          </div>
          <div style=" padding: 50px 0; ">
            <div style="background: white; height: 1px;"></div>
            <p style="color: #bababa; font-size: 15px">
              @2022&nbsp;Copyright Lucy
            </p>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
}
  