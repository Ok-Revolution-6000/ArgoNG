const STORAGE_KEY = 'argong.voice.microphone';
let selectedDevice;
export function readMicrophone() {
  if (selectedDevice !== undefined) return selectedDevice;
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}
export function saveMicrophone(value) {
  selectedDevice = value || '';
  try {
    localStorage.setItem(STORAGE_KEY, selectedDevice);
  } catch {
    /* session preference still works */
  }
}
export function microphoneConstraints(deviceId = readMicrophone()) {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
    },
  };
}

/** Enumerate without recording; request permission only after an explicit click. */
export function bindMicrophoneSelector(
  ui,
  { media = globalThis.navigator?.mediaDevices } = {},
) {
  const root = ui.microphoneSettings;
  if (!root) return () => {};
  const select = root.querySelector('select');
  const button = root.querySelector('[data-microphone-refresh]');
  const message = root.querySelector('[data-microphone-message]');
  let disposed = false;
  let generation = 0;
  const refresh = async () => {
    const epoch = ++generation;
    try {
      const devices = await media.enumerateDevices();
      if (disposed || epoch !== generation) return;
      const inputs = devices.filter(
        (device) => device.kind === 'audioinput' && device.deviceId,
      );
      const selected = readMicrophone();
      select.replaceChildren(new Option('System default microphone', ''));
      for (const [index, device] of inputs.entries()) {
        select.add(
          new Option(
            device.label || `Microphone ${index + 1}`,
            device.deviceId,
          ),
        );
      }
      if (selected && !inputs.some((device) => device.deviceId === selected)) {
        select.add(
          new Option('Previously selected microphone (unavailable)', selected),
        );
      }
      select.value = selected;
      message.textContent =
        selected && !inputs.some((device) => device.deviceId === selected)
          ? 'Reconnect this microphone or choose another before starting voice.'
          : inputs.some((device) => device.label)
            ? 'Your choice applies when you next start voice. Stop and restart Jason to switch.'
            : 'Click Allow microphones to reveal device names. The permission check stops immediately.';
    } catch {
      if (!disposed)
        message.textContent =
          'Could not list microphones. Check browser microphone permissions.';
    }
  };
  const requestPermission = async () => {
    button.disabled = true;
    let stream;
    try {
      stream = await media.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
      if (!disposed) await refresh();
    } catch (error) {
      if (!disposed)
        message.textContent =
          error.name === 'NotAllowedError'
            ? 'Microphone access was denied. Allow it in your browser’s site settings, then try again.'
            : 'No microphone could be opened. Check that it is connected and available.';
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      if (!disposed) button.disabled = false;
    }
  };
  const change = () => {
    saveMicrophone(select.value);
    void refresh();
  };
  const toggle = () => {
    if (root.open) {
      if (ui.usageDetails) ui.usageDetails.open = false;
      void refresh();
    }
  };
  const usageToggle = () => {
    if (ui.usageDetails?.open) root.open = false;
  };
  const keydown = (event) => {
    if (event.key === 'Escape' && root.open) {
      event.preventDefault();
      event.stopPropagation();
      root.open = false;
      root.querySelector('summary').focus();
    }
  };
  if (!media?.enumerateDevices || !media?.getUserMedia) {
    select.disabled = true;
    button.disabled = true;
    message.textContent =
      'Microphone selection is unavailable in this browser.';
    return () => {};
  }
  select.addEventListener('change', change);
  button.addEventListener('click', requestPermission);
  root.addEventListener('toggle', toggle);
  ui.usageDetails?.addEventListener('toggle', usageToggle);
  root.addEventListener('keydown', keydown);
  media.addEventListener?.('devicechange', refresh);
  void refresh();
  return () => {
    disposed = true;
    generation++;
    select.removeEventListener('change', change);
    button.removeEventListener('click', requestPermission);
    root.removeEventListener('toggle', toggle);
    ui.usageDetails?.removeEventListener('toggle', usageToggle);
    root.removeEventListener('keydown', keydown);
    media.removeEventListener?.('devicechange', refresh);
  };
}
