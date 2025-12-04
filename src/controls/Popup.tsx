import React, { useState, useEffect, useRef } from 'react';
import '../common/colours.css';
import './popup.css';
import Toggle from '../common/Toggle';
import MultiToggle from '../common/MultiToggle';


const Popup: React.FC = () => {

  enum HideOption {
    Block = 2,
    Obscure = 1,
    Reveal = 0
  }

  const get = (key: string) => {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(key, (result) => {
        resolve(result[key]);
      });
    });
  };

  const [enabled, setEnabled] = useState( false);
  const [hideIt, setHideIt] = useState(false);
  const [hideOption, setHideOption] = useState<number>(1);
  const [reportIt, setReportIt] = useState(false);
  const [help, setHelp] = useState(false);


  function loadSettings() {
    get('enabled').then((enabled) => setEnabled(enabled as boolean));
    get('hideIt').then((hideIt) => setHideIt(hideIt as boolean));
    get('hideOption').then((hideOption) => setHideOption(hideOption as number));
    get('reportIt').then((reportIt) => setReportIt(reportIt as boolean));
    get('help').then((help) => setHelp(help as boolean));
  }
  useEffect(() => {
    loadSettings();
    // updateStatus('Settings loaded', 'info');
  }, []);

  
  const store = (values: any) => chrome.storage.sync.set(values);

  useEffect(() => {
    store({ enabled: enabled }).then(() => {
      // updateStatus(enabled ? 'Extension enabled' : 'Extension disabled', 'success');
    });
  }, [enabled]);


  const hideOptionMessage = (hideOption: HideOption) => {
    switch (hideOption) {
      case HideOption.Reveal:
        return 'Content reveals on click';
      case HideOption.Obscure:
        return 'Content is obscured';
      case HideOption.Block:
        return 'Content does not appear in the feed';
    }
  }

  useEffect(() => {
    store({ hideIt: hideIt }).then(() => {
      // updateStatus(hideIt ? hideOptionMessage(hideOption) : 'All content visible', 'success');
    });
    }, [hideIt]);

  useEffect(() => {
    store({ hideOption: hideOption }).then(() => {
      // updateStatus(hideOptionMessage(hideOption), 'success');
    });
    }, [hideOption]);

  useEffect(() => {
    store({ reportIt: reportIt }).then(() => {
      // updateStatus(reportIt ? 'Reporting options shown' : 'Reporting options hidden', 'success');
    });
    }, [reportIt]);

  useEffect(() => {
    store({ help: help }).then(() => {
      // updateStatus(help ? 'Support options shown' : 'Support options hidden', 'success');
    });
  }, [help]);



  const [statusMessage, setStatusMessage] = useState<{ message: string; type: string; show: boolean }>({
    message: '',
    type: '',
    show: false
  });

  // const updateStatus = (message: string, type: string) => {
  //   setStatusMessage({ message, type, show: true });
  //   setTimeout(() => {
  //     setStatusMessage({ ...statusMessage, show: false });
  //   }, 3000);
  // };

  const mainCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let height = 382;
    if (!enabled) {
      height = 200;
    } else if (hideIt) {
      if (hideOption === HideOption.Reveal) {
        height = 498
      } else {
        height = 377;
      }
    }
    height += 12;
    document.body.style.height = `${height}px`;
  }, [hideIt, hideOption, enabled]);

  return (
    <>
      <div className="main-card" ref={mainCardRef} role="region" aria-label="Extension settings">
        {/* Header */}
        <div className="header" role="heading" aria-level={1}>
          <div className="header-icon">
            <i className="fas fa-hand-holding-heart"></i>
          </div>
          <div className="header-text">
            Making your social <br /> media safer.
          </div>
        </div>

        {/* Main Enable Toggle */}
        <div className="toggle-section-main" title="Enable or disable the extension"
        aria-label="Enable or disable the extension">
          <div className="toggle-left">
            <div className={`toggle-icon enable`}>
              <i className="fas fa-power-off"></i>
            </div>
            <div className={`toggle-text enable`}>{enabled ? "Enabled" : "Disabled"}</div>
          </div>
          <Toggle checked={enabled} onClick={() => setEnabled(!enabled)} />
        </div>
        <div className={`conditional-toggles ${enabled ? 'show' : ''}`}>
        {/* Hide It Selection */}
        <div className="toggle-section" title="Hide or show all content"
        aria-label="Hide or show all content">
          <div className="toggle-left">
            <div className={`toggle-icon hide`}>
              <i className="fas fa-eye"></i>
            </div>
            <div className={`toggle-text hide`}>Hide it</div>
          </div>
          <Toggle checked={hideIt} onClick={() => setHideIt(!hideIt)} />
        </div>

        {/* Multi-Toggle Section */}
        <div className={`multi-toggle-container ${hideIt ? 'show' : 'hide'}`} 
          aria-label="Choose how to hide content"
        >
          <MultiToggle
            selectedIndex={hideOption}
            options={[
              { label: "Option to reveal", icon: "fas fa-eye", onClick: () => setHideOption(0), title: "Post will be blurred out, but you can click to see it" },
              { label: "No option<br/> to reveal", icon: "fas fa-eye-low-vision", onClick: () => setHideOption(1), title: "Post will always be blurred out" },
              { label: "Remove all trace", icon: "fas fa-ban", onClick: () => setHideOption(2), title: "You will not see any sign of the post or poster" }]
            } 
          />
        </div>

        {/* Conditional Toggles (only visible when hideOption is "reveal") */}
        <div className={`conditional-toggles ${(hideOption === HideOption.Reveal || !hideIt) ? 'show' : ''}`}>
          <div className="toggle-section" title="Show options to report harmful content"
          aria-label="Show options to report harmful content">
            <div className="toggle-left">
              <div className={`toggle-icon report`}>
                <i className="fas fa-flag"></i>
              </div>
              <div className={`toggle-text report`}>Report it</div>
            </div>
            <Toggle checked={reportIt} onClick={() => setReportIt(!reportIt)} />
          </div>

          <div className="toggle-section" title="Show options to get help"
          aria-label="Show options to get help">
            <div className="toggle-left">
              <div className={`toggle-icon help`}>
                <i className="fas fa-heart"></i>
              </div>
              <div className={`toggle-text help`}>Get help</div>
            </div>
            <Toggle checked={help} onClick={() => setHelp(!help)} />
          </div>
        </div>
        </div>
      </div>

      {/* Status Message */}
      <div className={`status-message ${statusMessage.type} ${statusMessage.show ? 'show' : ''}`}>
        {statusMessage.message}
      </div>
      <div className="fixed-layer">
        {/* Footer Buttons */}
        <div className="footer-buttons">
          <button className="footer-button">
            <i className="fas fa-info-circle"></i>
            <span>About</span>
          </button>
          <button className="footer-button">
            <i className="fas fa-lock"></i>
            <span>Privacy</span>
          </button>
        </div>

      </div>
    </>
  );
};

export default Popup;