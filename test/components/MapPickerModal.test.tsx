import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import MapPickerModal from "@/components/MapPickerModal";

// Mock Leaflet - ensure all methods are properly defined
vi.mock("leaflet", () => {
  const mockSetView = vi.fn().mockReturnThis();
  const mockRemove = vi.fn();
  const mockOn = vi.fn().mockReturnThis();
  const mockAddTo = vi.fn().mockReturnThis();
  const mockSetLatLng = vi.fn().mockReturnThis();

  const mockMarker = {
    setLatLng: mockSetLatLng,
    addTo: mockAddTo,
  };

  const mockMapInstance = {
    setView: mockSetView,
    remove: mockRemove,
    on: mockOn,
  };

  const mockTileLayer = {
    addTo: mockAddTo,
  };

  return {
    default: {
      map: vi.fn(() => mockMapInstance),
      tileLayer: vi.fn(() => mockTileLayer),
      marker: vi.fn(() => mockMarker),
      Icon: {
        Default: {
          prototype: {},
          mergeOptions: vi.fn(),
        },
      },
    },
    map: vi.fn(() => mockMapInstance),
    tileLayer: vi.fn(() => mockTileLayer),
    marker: vi.fn(() => mockMarker),
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn(),
      },
    },
  };
});

// Mock fetch for geocoding
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("MapPickerModal", () => {
  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("should render modal with title and close button", () => {
    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Select Location on Map")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/搜尋地點/)).toBeInTheDocument();
    expect(screen.getByText("取消")).toBeInTheDocument();
    expect(screen.getByText("確認位置")).toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", () => {
    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    // Click the X button (first button in header)
    const closeButtons = screen.getAllByRole("button");
    fireEvent.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should call onClose when cancel button is clicked", () => {
    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText("取消"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should show loading state initially", () => {
    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Loading map...")).toBeInTheDocument();
  });

  it("should show no location selected initially when no coords provided", () => {
    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("尚未選擇位置")).toBeInTheDocument();
  });

  it("should disable confirm button when no coords selected", () => {
    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const confirmButton = screen.getByText("確認位置");
    expect(confirmButton).toBeDisabled();
  });

  it("should show selected coords when latitude and longitude provided", () => {
    render(
      <MapPickerModal
        latitude={25.033}
        longitude={121.565}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/已選擇/)).toBeInTheDocument();
    expect(screen.getByText(/25.033000, 121.565000/)).toBeInTheDocument();
  });

  it("should enable confirm button when coords are provided", () => {
    render(
      <MapPickerModal
        latitude={25.033}
        longitude={121.565}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const confirmButton = screen.getByText("確認位置");
    expect(confirmButton).not.toBeDisabled();
  });

  it("should call onSelect with coords when confirm button is clicked", () => {
    render(
      <MapPickerModal
        latitude={25.033}
        longitude={121.565}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const confirmButton = screen.getByText("確認位置");
    fireEvent.click(confirmButton);

    expect(mockOnSelect).toHaveBeenCalledWith(25.033, 121.565);
  });

  it("should handle search input", () => {
    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const input = screen.getByPlaceholderText(/搜尋地點/);
    fireEvent.change(input, { target: { value: "Tokyo" } });

    expect(input).toHaveValue("Tokyo");
  });

  it("should not search when query is empty", async () => {
    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText("搜尋"));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should show help text when no error", () => {
    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("點擊地圖任意位置選擇座標，或搜尋地點名稱")).toBeInTheDocument();
  });

  it("should not call onSelect if confirm is clicked without coords", () => {
    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const confirmButton = screen.getByText("確認位置");
    fireEvent.click(confirmButton);

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it("should trigger search on Enter key press", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([]),
    });

    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const input = screen.getByPlaceholderText(/搜尋地點/);
    fireEvent.change(input, { target: { value: "Tokyo" } });

    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("nominatim.openstreetmap.org"),
      expect.any(Object)
    );
  });

  it("should handle search that returns results", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([
        { lat: "35.6762", lon: "139.6503", display_name: "Tokyo" },
      ]),
    });

    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const input = screen.getByPlaceholderText(/搜尋地點/);
    fireEvent.change(input, { target: { value: "Tokyo" } });

    await act(async () => {
      fireEvent.click(screen.getByText("搜尋"));
    });

    // Search was triggered
    expect(mockFetch).toHaveBeenCalled();
  });

  it("should handle search that returns no results", async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve([]),
    });

    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const input = screen.getByPlaceholderText(/搜尋地點/);
    fireEvent.change(input, { target: { value: "InvalidLocation12345" } });

    await act(async () => {
      fireEvent.click(screen.getByText("搜尋"));
    });

    expect(screen.getByText("找不到此地點，請嘗試其他關鍵字")).toBeInTheDocument();
  });

  it("should handle search error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const input = screen.getByPlaceholderText(/搜尋地點/);
    fireEvent.change(input, { target: { value: "Tokyo" } });

    await act(async () => {
      fireEvent.click(screen.getByText("搜尋"));
    });

    expect(screen.getByText("搜尋失敗，請稍後再試")).toBeInTheDocument();
  });

  it("should handle abort error", async () => {
    const abortError = new Error("Aborted");
    abortError.name = "AbortError";
    mockFetch.mockRejectedValueOnce(abortError);

    render(
      <MapPickerModal
        latitude={null}
        longitude={null}
        onSelect={mockOnSelect}
        onClose={mockOnClose}
      />
    );

    const input = screen.getByPlaceholderText(/搜尋地點/);
    fireEvent.change(input, { target: { value: "Tokyo" } });

    await act(async () => {
      fireEvent.click(screen.getByText("搜尋"));
    });

    expect(screen.getByText("搜尋逾時，請稍後再試")).toBeInTheDocument();
  });
});
