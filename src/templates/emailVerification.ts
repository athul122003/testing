export const emailVerificationTemplate = `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Verifiy Email</title>
    <style>
      @media only screen and (max-width: 620px) {
        table[class="body"] h1 {
          font-size: 28px !important;
          margin-bottom: 10px !important;
        }

        table[class="body"] p,
        table[class="body"] ul,
        table[class="body"] ol,
        table[class="body"] td,
        table[class="body"] span,
        table[class="body"] a {
          font-size: 16px !important;
        }

        table[class="body"] .wrapper,
        table[class="body"] .article {
          padding: 10px !important;
        }

        table[class="body"] .content {
          padding: 0 !important;
        }

        table[class="body"] .container {
          padding: 0 !important;
          width: 100% !important;
        }

        table[class="body"] .main {
          border-left-width: 0 !important;
          border-radius: 0 !important;
          border-right-width: 0 !important;
        }

        table[class="body"] .btn table {
          width: 100% !important;
        }

        table[class="body"] .btn a {
          width: 100% !important;
        }

        table[class="body"] .img-responsive {
          height: auto !important;
          max-width: 100% !important;
          width: auto !important;
        }
      }
      @media all {
        .ExternalClass {
          width: 100%;
        }

        .ExternalClass,
        .ExternalClass p,
        .ExternalClass span,
        .ExternalClass font,
        .ExternalClass td,
        .ExternalClass div {
          line-height: 100%;
        }

        .apple-link a {
          color: inherit !important;
          font-family: inherit !important;
          font-size: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
          text-decoration: none !important;
        }

        .btn-primary table td:hover {
          background-color: #be0fb5 !important;
        }

        .btn-primary a:hover {
          background-color: #be0fb5 !important;
          border-color: #be0fb5 !important;
        }
      }
    </style>
  </head>
  <body
    class
    style="
      width: max-content;
      background: #011548;
      color: #ffffff;
      font-weight: 500;
      font-size: 1.2rem;
      font-family: sans-serif;
      line-height: 1.4;
      margin: auto;
      padding: 0;
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    "
  >
    <table
      role="presentation"
      border="0"
      cellpadding="0"
      cellspacing="0"
      class="body"
      style="
        border-collapse: separate;
        mso-table-rspace: 0pt;
        min-width: 100%;
        width: 100%;
      "
      width="100%"
    >
      <tr>
        <td
          style="font-family: sans-serif; font-size: 14px; vertical-align: top"
          valign="top"
        >
          &nbsp;
        </td>
        <td
          class="container"
          style="
            font-family: sans-serif;
            font-size: 14px;
            vertical-align: top;
            display: block;
            max-width: 580px;
            padding: 10px;
            width: 580px;
            margin: 0 auto;
          "
          width="580"
          valign="top"
        >
          <div class="header" style="padding: 10px 0">
            <table
              role="presentation"
              border="0"
              cellpadding="0"
              cellspacing="0"
              style="
                border-collapse: separate;
                mso-table-rspace: 0pt;
                min-width: 100%;
                width: 100%;
              "
              width="100%"
            >
              <tr>
                <td
                  class="align-center"
                  style="
                    font-family: sans-serif;
                    font-size: 14px;
                    vertical-align: top;
                    text-align: center;
                  "
                  valign="top"
                  align="center"
                >
                  <a
                    href="https://www.finiteloop.club/"
                    style="color: #be0fb5; text-decoration: underline"
                    ><img
                      src="https://res.cloudinary.com/dfhg1joox/image/upload/v1724508456/tpgpvabxiwzyssx5sxwn.png"
                      width="200"
                      alt="Finite Loop Club"
                      style="
                        border: none;
                        -ms-interpolation-mode: bicubic;
                        max-width: 100%;
                      "
                  /></a>
                </td>
              </tr>
            </table>
          </div>
          <div
            class="content"
            style="
              box-sizing: border-box;
              display: block;
              margin: 0 auto;
              max-width: 580px;
              padding: 10px;
            "
          >
            <!-- START CENTERED WHITE CONTAINER -->

            <span
              class="preheader"
              style="
                color: transparent;
                display: none;
                height: 0;
                max-height: 0;
                max-width: 0;
                opacity: 0;
                overflow: hidden;
                mso-hide: all;
                visibility: hidden;
                width: 0;
              "
              >FLC Email Verification</span
            >
            <table
              role="presentation"
              class="main"
              style="
                border-collapse: separate;
                mso-table-rspace: 0pt;
                min-width: 100%;
                color: white;
                width: 100%;
              "
              width="100%"
            >
              <!-- START MAIN CONTENT AREA -->
              <tr>
                <td
                  class="wrapper"
                  style="
                    font-family: sans-serif;
                    font-size: 14px;
                    vertical-align: top;
                    box-sizing: border-box;
                    padding: 20px;
                  "
                  valign="top"
                >
                  <table
                    role="presentation"
                    border="0"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      border-collapse: separate;
                      mso-table-rspace: 0pt;
                      min-width: 100%;
                      width: 100%;
                    "
                    width="100%"
                  >
                    <tr>
                      <td
                        style="
                          font-family: sans-serif;
                          font-size: 14px;
                          vertical-align: top;
                        "
                        valign="top"
                      >
                        <p
                          style="
                            font-family: sans-serif;
                            font-weight: normal;
                            margin: -60px 0 0 0;
                            margin-bottom: 15px;
                            font-size: 2rem;
                          "
                        >
                          Hi {{name}}, ready to boot up your future?
                        </p>
                        <p
                          style="
                            font-family: sans-serif;
                            font-weight: normal;
                            margin: 0;
                            margin-bottom: 15px;
                            font-size: 1.2rem;
                            color: #fff;
                          "
                        >
                          Thank you for joining Finite Loop Club! Please click
                          the button below to verify your email address:
                        </p>
                        <table
                          role="presentation"
                          border="0"
                          cellpadding="0"
                          cellspacing="0"
                          class="btn btn-primary"
                          style="
                            border-collapse: separate;
                            mso-table-rspace: 0pt;
                            box-sizing: border-box;
                            min-width: 100%;
                            width: 100%;
                          "
                          width="100%"
                        >
                          <tbody>
                            <tr>
                              <td
                                align="left"
                                style="
                                  font-family: sans-serif;
                                  font-size: 14px;
                                  vertical-align: top;
                                  padding-bottom: 15px;
                                "
                                valign="top"
                              >
                                <table
                                  role="presentation"
                                  border="0"
                                  cellpadding="0"
                                  cellspacing="0"
                                  style="
                                    border-collapse: separate;
                                    mso-table-rspace: 0pt;
                                    min-width: auto;
                                    width: auto;
                                  "
                                >
                                  <tbody>
                                    <tr>
                                      <td
                                        style="
                                          font-family: sans-serif;
                                          font-size: 14px;
                                          vertical-align: top;
                                          border-radius: 5px;
                                          text-align: center;
                                          background-color: #be0fb5;
                                        "
                                        valign="top"
                                        align="center"
                                        bgcolor="#be0fb5"
                                      >
                                        <a
                                          href="{{verify_url}}"
                                          target="_blank"
                                          style="
                                            border: solid 1px #be0fb5;
                                            border-radius: 5px;
                                            box-sizing: border-box;
                                            cursor: pointer;
                                            display: inline-block;
                                            font-size: 14px;
                                            font-weight: bold;
                                            margin: 0;
                                            padding: 12px 25px;
                                            text-decoration: none;
                                            text-transform: capitalize;
                                            background-color: #be0fb5;
                                            border-color: #be0fb5;
                                            color: #ffffff;
                                          "
                                          >Verify Email</a
                                        >
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <table
                      style="
                        border-collapse: separate;
                        mso-table-lspace: 0pt;
                        min-width: 100%;
                        width: 100%;
                      "
                      width="100%"
                    >
                      <tbody>
                        <tr>
                          <div
                            class="cnt-img"
                            style="
                              padding-top: 10px;
                              max-width: 400px;
                              margin: auto;
                              margin-top: 35px;
                              height: 300px;
                              text-align: center;
                              background: url(&quot;https://res.cloudinary.com/dfhg1joox/image/upload/v1724513503/btvivljfvltfvnilzt05.png&quot;);
                              background-position: top;
                              background-repeat: no-repeat;
                              background-size: contain;
                            "
                          ></div>
                        </tr>
                      </tbody>
                    </table>
                  </table>
                </td>
              </tr>

              <!-- END MAIN CONTENT AREA -->
            </table>

            <!-- START FOOTER -->
            <hr
              style="
                width: 90%;
                height: 0.125rem;
                margin: auto;
                border-radius: 4px;
                background-color: #be0fb5;
                text-decoration-style: none;
                border: none;
              "
            />
            <div style="text-align: center; margin-top: 1.25rem">
              <a
                href="{{canonical_url}}"
                style="
                  margin: 0.75rem auto;
                  color: inherit;
                  text-decoration: inherit;
                  font-size: 1.25rem;
                  line-height: 1.75rem;
                "
                >Finite Loop Club</a
              >
              <p style="margin: 0">NMAM Institute of Technology, Nitte</p>
              <p style="margin: 0">Karnataka, 574110, IN</p>
            </div>
            <div style="margin: 1.5rem auto; width: fit-content">
              <a
                style="
                  color: inherit;
                  text-decoration: inherit;
                  margin: 0 1.5rem;
                  display: inline-block;
                "
                href="{{instagram}}"
              >
                <img
                  src="https://img.icons8.com/?size=200&id=32292&format=png&color=ffffff"
                  alt="Instagram"
                  style="height: 1.75rem; width: 1.75rem"
                />
              </a>
              <a
                style="
                  color: inherit;
                  text-decoration: inherit;
                  margin: 0 1.5rem;
                  display: inline-block;
                "
                href="{{facebook}}"
                ><img
                  src="https://img.icons8.com/?size=200&id=435&format=png&color=ffffff"
                  alt="Facebook"
                  style="height: 1.75rem; width: 1.75rem"
              /></a>
              <a
                style="
                  color: inherit;
                  text-decoration: inherit;
                  margin: 0 1.5rem;
                  display: inline-block;
                "
                href="{{linkedin}}"
                ><img
                  src="https://img.icons8.com/?size=200&id=447&format=png&color=ffffff"
                  alt="LinkedIn"
                  style="height: 1.75rem; width: 1.75rem"
              /></a>
              <a
                style="
                  color: inherit;
                  text-decoration: inherit;
                  margin: 0 1.5rem;
                  display: inline-block;
                "
                href="{{email}}"
                ><img
                  src="https://img.icons8.com/?size=200&id=53388&format=png&color=ffffff"
                  alt="Email"
                  style="height: 1.75rem; width: 1.75rem"
              /></a>
              <a
                style="
                  color: inherit;
                  text-decoration: inherit;
                  margin: 0 1.5rem;
                  display: inline-block;
                "
                href="{{phone}}"
                ><img
                  src="https://img.icons8.com/?size=200&id=2olGSGqpqGWD&format=png&color=ffffff"
                  alt="Phone"
                  style="height: 1.75rem; width: 1.75rem"
              /></a>
            </div>
            <div
              style="
                font-size: 0.875rem;
                line-height: 1.25rem;
                margin: 1.5rem auto;
                width: fit-content;
              "
            >
              <a
                style="
                  color: inherit;
                  text-decoration: inherit;
                  margin: 0 1rem;
                  display: inline-block;
                "
                href="{{canonical_url}}/privacy-policy"
                >Privacy</a
              >
              |
              <a
                style="
                  color: inherit;
                  text-decoration: inherit;
                  margin: 0 0.25rem;
                  display: inline-block;
                "
                href="{{canonical_url}}/terms"
                >Terms &amp; Conditions</a
              >
              |
              <a
                style="
                  color: inherit;
                  text-decoration: inherit;
                  margin: 0 0.25rem;
                  display: inline-block;
                "
                href="{{canonical_url}}/refund"
                >Refund &amp; Cancellation</a
              >
              |
              <a
                style="
                  color: inherit;
                  text-decoration: inherit;
                  margin: 0 0.25rem;
                  display: inline-block;
                "
                href="{{canonical_url}}/contact-us"
                >Contact us</a
              >
              |
              <a
                style="
                  color: inherit;
                  text-decoration: inherit;
                  margin: 0 0.25rem;
                  display: inline-block;
                "
                href="{{canonical_url}}/shipping"
                >Shipping</a
              >
            </div>
            <!-- END FOOTER -->

            <!-- END CENTERED WHITE CONTAINER -->
          </div>
        </td>
        <td
          style="font-family: sans-serif; font-size: 14px; vertical-align: top"
          valign="top"
        >
          &nbsp;
        </td>
      </tr>
    </table>
  </body>
</html>
`;
