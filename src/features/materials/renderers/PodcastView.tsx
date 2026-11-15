import {useEffect, useRef, useState} from 'react';
import {IconButton} from '../../../ui';
import {PodcastSpeaker} from '../../../services/audioSynthesizer';
import {Icon} from '../../../ui/Icon';

interface PodcastLine {
  speaker: 'Sofía (Host)' | 'Lucas (Co-host)';
  text: string;
  timestamp?: string;
}

/**
 * Podcast player on top of the browser speech synthesis (same behavior as the
 * legacy viewer): play / pause, restart, click a line to start from it. Speech
 * is stopped when the player unmounts (viewer closed / mode switched).
 */
export function PodcastView({lines}: {lines: PodcastLine[]}) {
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const alive = useRef(true);
  // Cancelling speech fires the previous utterance's end callback: only the latest run may advance.
  const run = useRef(0);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      run.current++;
      PodcastSpeaker.stop();
    };
  }, []);

  const playLine = (idx: number) => {
    const line = linesRef.current[idx];
    if (!line) {
      setPlaying(false);
      return;
    }
    const myRun = ++run.current;
    setIndex(idx);
    setPlaying(true);
    PodcastSpeaker.speakLine(line.text, line.speaker, 1.0, () => {
      if (!alive.current || run.current !== myRun) return;
      if (idx + 1 < linesRef.current.length) playLine(idx + 1);
      else setPlaying(false);
    });
  };

  const toggle = () => {
    if (playing) {
      run.current++;
      PodcastSpeaker.pause();
      setPlaying(false);
    } else {
      // A paused synth can stay paused after cancel(): clear that state first.
      PodcastSpeaker.resume();
      playLine(index);
    }
  };

  return (
    <div className="mx-auto w-full max-w-reading space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-card border-[1.5px] border-ink bg-primary-tint p-4 text-primary-on-tint shadow-offset sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <IconButton
            variant="primary"
            onClick={toggle}
            aria-label={playing ? 'Pausar audio' : 'Reproducir audio'}
            className="size-12"
            icon={playing ? <Icon name="pause" weight="fill" className="size-5" /> : <Icon name="play" weight="fill" className="ml-0.5 size-5" />}
          />
          <div className="min-w-0">
            <h2 className="font-display text-h2">Audio resumen</h2>
            <p className="text-small" role="status">
              {playing ? 'Reproduciendo con voz sintetizada en español' : 'En pausa'}
            </p>
          </div>
        </div>
        <IconButton
          aria-label="Reiniciar audio"
          icon={<Icon name="reset" className="size-5" />}
          onClick={() => {
            run.current++;
            PodcastSpeaker.stop();
            setPlaying(false);
            setIndex(0);
          }}
        />
      </div>

      <ol className="space-y-3 border-l border-rule pl-4">
        {lines.map((line, idx) => {
          const host = line.speaker?.includes('Sofía');
          const current = playing && index === idx;
          return (
            <li key={idx}>
              <button
                type="button"
                onClick={() => playLine(idx)}
                aria-current={current || undefined}
                className={`block min-h-11 w-full rounded-control border p-4 text-left transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                  current
                    ? 'border-ink bg-highlight text-highlight-ink shadow-offset'
                    : host
                      ? 'border-rule bg-surface hover:border-ink'
                      : 'border-rule bg-subtle hover:border-ink'
                }`}
              >
                <span className="mb-1 flex items-center justify-between font-mono text-caption uppercase tracking-widest">
                  <span className={current ? 'text-highlight-ink' : host ? 'text-primary-text' : 'text-strong'}>{line.speaker}</span>
                  {line.timestamp ? <span className={current ? 'text-highlight-ink' : 'text-muted'}>{line.timestamp}</span> : null}
                </span>
                <span className={`block text-small ${current ? 'text-highlight-ink' : 'text-default'}`}>{line.text}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
