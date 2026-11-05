import { useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { Activity, CandlestickChart, ChevronDown, Crosshair, LineChart, MoveHorizontal, Plus, Search, Settings, SlidersHorizontal, Star, TrendingUp, Wallet, ZoomIn, ZoomOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { fetchLivePrices, type LivePriceMap } from '../lib/livePrices';
import { fetchMarketCandles } from '../lib/marketData';

